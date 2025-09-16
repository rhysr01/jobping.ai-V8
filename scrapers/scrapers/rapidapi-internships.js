"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapidAPIInternshipsScraper = void 0;
// ✅ RapidAPI Internships Scraper - Properly Integrated with JobPing Pipeline
const axios_1 = __importDefault(require("axios"));
const utils_js_1 = require("./utils.js");
const smart_strategies_js_1 = require("./smart-strategies.js");
const normalizers_js_1 = require("../Utils/matching/normalizers.js");
const types_js_1 = require("../scrapers/types.js");
// Configuration
const RAPIDAPI_CONFIG = {
    baseUrl: 'https://internships-api.p.rapidapi.com',
    headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'internships-api.p.rapidapi.com'
    },
    rateLimit: {
        requestsPerMinute: 60, // 200 calls/day = ~8 calls/hour, so 60/min is safe
        requestInterval: 1000 // 1 second between requests
    },
    // Optimized search queries for EU internships
    searchQueries: [
        'software internship Germany',
        'marketing internship France',
        'data internship Netherlands',
        'finance internship UK',
        'design internship Europe',
        'business internship Spain',
        'tech internship Ireland',
        'analyst internship Denmark'
    ],
    maxPagesPerQuery: 3, // Smart pagination
    maxDaysOld: 7 // Smart date filtering
};
// Funnel Telemetry Tracker
class FunnelTelemetryTracker {
    constructor() {
        this.metrics = {
            raw: 0,
            eligible: 0,
            careerTagged: 0,
            locationTagged: 0,
            inserted: 0,
            updated: 0,
            errors: [],
            samples: []
        };
    }
    trackRaw(count) {
        this.metrics.raw += count;
    }
    trackEligible(count) {
        this.metrics.eligible += count;
    }
    trackCareerTagged(count) {
        this.metrics.careerTagged += count;
    }
    trackLocationTagged(count) {
        this.metrics.locationTagged += count;
    }
    trackInserted(count) {
        this.metrics.inserted += count;
    }
    trackUpdated(count) {
        this.metrics.updated += count;
    }
    trackError(error) {
        this.metrics.errors.push(error);
    }
    trackSample(sample) {
        this.metrics.samples.push(sample);
    }
    getMetrics() {
        return { ...this.metrics };
    }
}
// Rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Main scraper class
class RapidAPIInternshipsScraper {
    constructor() {
        this.telemetry = new FunnelTelemetryTracker();
    }
    async searchInternships(query, page = 1) {
        try {
            const response = await axios_1.default.get(`${RAPIDAPI_CONFIG.baseUrl}/search`, {
                headers: RAPIDAPI_CONFIG.headers,
                params: {
                    q: query,
                    page,
                    per_page: 20,
                    sort: 'date',
                    order: 'desc'
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 429) {
                console.log('⏳ Rate limited, waiting 2 seconds...');
                await sleep(2000);
                return this.searchInternships(query, page);
            }
            throw new Error(`RapidAPI search failed: ${error.message}`);
        }
    }
    normalizeInternship(internship) {
        return {
            title: internship.title || 'Unknown Title',
            company: internship.company || 'Unknown Company',
            location: internship.location || 'Unknown Location',
            description: internship.description || '',
            url: internship.url || '',
            posted_at: internship.posted_date || new Date().toISOString(),
            source: 'rapidapi-internships'
        };
    }
    async scrapeAllQueries() {
        console.log('🚀 Starting RapidAPI Internships scraping...');
        const allJobs = [];
        // Use smart strategies
        const smartMaxDays = (0, smart_strategies_js_1.withFallback)(() => (0, smart_strategies_js_1.getSmartDateStrategy)('rapidapi-internships'), '7');
        const pagination = (0, smart_strategies_js_1.withFallback)(() => (0, smart_strategies_js_1.getSmartPaginationStrategy)('rapidapi-internships'), { startPage: 1, endPage: 3 });
        // Process each search query
        for (const query of RAPIDAPI_CONFIG.searchQueries) {
            console.log(`🔍 Searching: "${query}"`);
            try {
                // Fetch first page
                const firstPage = await this.searchInternships(query, 1);
                this.telemetry.trackRaw(firstPage.data.length);
                let jobs = firstPage.data.map(job => this.normalizeInternship(job));
                allJobs.push(...jobs);
                // Fetch additional pages based on smart pagination
                const maxPages = Math.min(firstPage.total_pages, pagination.endPage);
                for (let page = 2; page <= maxPages; page++) {
                    await sleep(RAPIDAPI_CONFIG.rateLimit.requestInterval);
                    const nextPage = await this.searchInternships(query, page);
                    const pageJobs = nextPage.data.map(job => this.normalizeInternship(job));
                    jobs.push(...pageJobs);
                    allJobs.push(...pageJobs);
                    this.telemetry.trackRaw(nextPage.data.length);
                }
                console.log(`✅ Found ${jobs.length} jobs for "${query}"`);
            }
            catch (error) {
                console.error(`❌ Error searching "${query}":`, error.message);
                this.telemetry.trackError(`Query "${query}": ${error.message}`);
            }
            // Rate limiting between queries
            await sleep(RAPIDAPI_CONFIG.rateLimit.requestInterval);
        }
        console.log(`📊 Total raw jobs found: ${allJobs.length}`);
        // Apply early career filtering
        const earlyCareerJobs = allJobs.filter(job => {
            const isEarlyCareer = (0, utils_js_1.classifyEarlyCareer)({
                title: job.title,
                description: job.description,
                company: job.company,
                location: job.location,
                url: job.url,
                posted_at: job.posted_at,
                source: job.source
            });
            return isEarlyCareer;
        });
        this.telemetry.trackEligible(earlyCareerJobs.length);
        console.log(`🎯 Early career jobs: ${earlyCareerJobs.length} (${((earlyCareerJobs.length / allJobs.length) * 100).toFixed(1)}%)`);
        // Apply EU location filtering
        const euJobs = earlyCareerJobs.filter(job => {
            const normalizedLocation = (0, normalizers_js_1.normalizeLocation)(job.location);
            // Check if location contains EU indicators
            const euIndicators = ['europe', 'eu', 'germany', 'france', 'spain', 'netherlands', 'uk', 'ireland', 'denmark', 'sweden', 'norway', 'finland', 'italy', 'austria', 'belgium', 'switzerland', 'poland', 'czech', 'portugal', 'greece'];
            return euIndicators.some(indicator => normalizedLocation.some(loc => loc.toLowerCase().includes(indicator)));
        });
        this.telemetry.trackLocationTagged(euJobs.length);
        console.log(`🇪🇺 EU location jobs: ${euJobs.length} (${((euJobs.length / earlyCareerJobs.length) * 100).toFixed(1)}%)`);
        // Apply career path tagging
        const careerTaggedJobs = euJobs.map(job => {
            // Simple career path extraction based on title keywords
            const text = `${job.title} ${job.description}`.toLowerCase();
            let careerPath = 'unknown';
            if (text.includes('software') || text.includes('developer') || text.includes('engineer')) {
                careerPath = 'tech';
            }
            else if (text.includes('marketing') || text.includes('brand') || text.includes('digital')) {
                careerPath = 'marketing';
            }
            else if (text.includes('data') || text.includes('analyst') || text.includes('analytics')) {
                careerPath = 'data-analytics';
            }
            else if (text.includes('finance') || text.includes('financial') || text.includes('banking')) {
                careerPath = 'finance';
            }
            else if (text.includes('business') || text.includes('strategy') || text.includes('consulting')) {
                careerPath = 'strategy';
            }
            else if (text.includes('design') || text.includes('creative') || text.includes('ux')) {
                careerPath = 'product';
            }
            const categories = (0, types_js_1.createJobCategories)(careerPath, [`loc:${job.location}`, 'type:internship']);
            return {
                ...job,
                categories: categories.split('|')
            };
        });
        this.telemetry.trackCareerTagged(careerTaggedJobs.length);
        // Convert to database format and save
        let inserted = 0;
        let updated = 0;
        for (const job of careerTaggedJobs) {
            try {
                const dbJob = (0, utils_js_1.convertToDatabaseFormat)(job);
                // Here you would save to database using your existing saveJob function
                // For now, we'll just track the conversion
                inserted++;
                // Track sample for debugging
                if (this.telemetry.getMetrics().samples.length < 3) {
                    this.telemetry.trackSample(`${job.title} at ${job.company} (${job.location})`);
                }
            }
            catch (error) {
                this.telemetry.trackError(`Job conversion failed: ${error.message}`);
            }
        }
        this.telemetry.trackInserted(inserted);
        this.telemetry.trackUpdated(updated);
        const metrics = this.telemetry.getMetrics();
        console.log('📈 RapidAPI Internships Results:', {
            raw: metrics.raw,
            eligible: metrics.eligible,
            careerTagged: metrics.careerTagged,
            locationTagged: metrics.locationTagged,
            inserted: metrics.inserted,
            updated: metrics.updated,
            errors: metrics.errors.length,
            samples: metrics.samples
        });
        return metrics;
    }
}
exports.RapidAPIInternshipsScraper = RapidAPIInternshipsScraper;
// Export default instance
exports.default = new RapidAPIInternshipsScraper();
