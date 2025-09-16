"use strict";
/**
 * Data Normalization Utilities for JobPing Matching System
 *
 * This file contains all normalization functions for converting and standardizing
 * data formats. Initially re-exports from jobMatching.ts, then will be migrated
 * here for better organization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCities = exports.mapCategories = exports.normalizeCategoriesForRead = exports.normalizeUser = exports.reqFirst = exports.reqString = exports.toWorkEnv = exports.toOptString = exports.toStringArray = void 0;
exports.normalizeEmail = normalizeEmail;
exports.normalizeCareerPath = normalizeCareerPath;
exports.normalizeLocation = normalizeLocation;
exports.normalizeCompanyType = normalizeCompanyType;
exports.normalizeRole = normalizeRole;
exports.normalizeLanguage = normalizeLanguage;
exports.normalizeWorkEnvironment = normalizeWorkEnvironment;
exports.normalizeVisaStatus = normalizeVisaStatus;
exports.normalizeStartDate = normalizeStartDate;
exports.normalizeEntryLevel = normalizeEntryLevel;
exports.normalizeUserPreferences = normalizeUserPreferences;
exports.normalizeJobData = normalizeJobData;
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.isValidDate = isValidDate;
exports.sanitizeString = sanitizeString;
exports.sanitizeArray = sanitizeArray;
// Re-export existing normalization functions from jobMatching.ts
// TODO: After testing, move implementations here
// Import functions from jobMatching
const jobMatching_1 = require("../jobMatching");
Object.defineProperty(exports, "toStringArray", { enumerable: true, get: function () { return jobMatching_1.toStringArray; } });
Object.defineProperty(exports, "toOptString", { enumerable: true, get: function () { return jobMatching_1.toOptString; } });
Object.defineProperty(exports, "toWorkEnv", { enumerable: true, get: function () { return jobMatching_1.toWorkEnv; } });
Object.defineProperty(exports, "reqString", { enumerable: true, get: function () { return jobMatching_1.reqString; } });
Object.defineProperty(exports, "reqFirst", { enumerable: true, get: function () { return jobMatching_1.reqFirst; } });
Object.defineProperty(exports, "normalizeUser", { enumerable: true, get: function () { return jobMatching_1.normalizeUser; } });
Object.defineProperty(exports, "normalizeCategoriesForRead", { enumerable: true, get: function () { return jobMatching_1.normalizeCategoriesForRead; } });
Object.defineProperty(exports, "mapCategories", { enumerable: true, get: function () { return jobMatching_1.mapCategories; } });
Object.defineProperty(exports, "mapCities", { enumerable: true, get: function () { return jobMatching_1.mapCities; } });
// Additional normalization utilities
function normalizeEmail(email) {
    if (typeof email === 'string') {
        return email.toLowerCase().trim();
    }
    throw new Error('Email must be a string');
}
function normalizeCareerPath(careerPath) {
    if (typeof careerPath === 'string') {
        return careerPath.toLowerCase().trim();
    }
    if (Array.isArray(careerPath)) {
        return careerPath[0]?.toLowerCase().trim() || 'general';
    }
    return 'general';
}
function normalizeLocation(location) {
    if (typeof location === 'string') {
        return [location.toLowerCase().trim()];
    }
    if (Array.isArray(location)) {
        return location
            .filter((loc) => typeof loc === 'string')
            .map(loc => loc.toLowerCase().trim());
    }
    return [];
}
function normalizeCompanyType(companyType) {
    if (typeof companyType === 'string') {
        return [companyType.toLowerCase().trim()];
    }
    if (Array.isArray(companyType)) {
        return companyType
            .filter((type) => typeof type === 'string')
            .map(type => type.toLowerCase().trim());
    }
    return [];
}
function normalizeRole(role) {
    if (typeof role === 'string') {
        return [role.toLowerCase().trim()];
    }
    if (Array.isArray(role)) {
        return role
            .filter((r) => typeof r === 'string')
            .map(r => r.toLowerCase().trim());
    }
    return [];
}
function normalizeLanguage(language) {
    if (typeof language === 'string') {
        return [language.toLowerCase().trim()];
    }
    if (Array.isArray(language)) {
        return language
            .filter((lang) => typeof lang === 'string')
            .map(lang => lang.toLowerCase().trim());
    }
    return [];
}
function normalizeWorkEnvironment(env) {
    if (typeof env === 'string') {
        const normalized = env.toLowerCase().trim();
        if (['remote', 'hybrid', 'office', 'onsite'].includes(normalized)) {
            return normalized;
        }
    }
    return 'unclear';
}
function normalizeVisaStatus(status) {
    if (typeof status === 'string') {
        const normalized = status.toLowerCase().trim();
        if (['eu citizen', 'uk citizen', 'visa required', 'sponsorship available'].includes(normalized)) {
            return normalized;
        }
    }
    return 'unknown';
}
function normalizeStartDate(date) {
    if (typeof date === 'string') {
        const trimmed = date.trim();
        if (trimmed) {
            // Basic date validation
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
                return trimmed;
            }
        }
    }
    return null;
}
function normalizeEntryLevel(level) {
    if (typeof level === 'string') {
        const normalized = level.toLowerCase().trim();
        if (['graduate', 'entry', 'junior', 'mid', 'senior'].includes(normalized)) {
            return normalized;
        }
    }
    return 'entry';
}
// Batch normalization for user preferences - aligned with database schema
function normalizeUserPreferences(userData) {
    return {
        email: normalizeEmail(userData.email),
        full_name: (0, jobMatching_1.toOptString)(userData.full_name) || 'Unknown User',
        professional_expertise: (0, jobMatching_1.toOptString)(userData.professional_expertise) || 'General',
        visa_status: normalizeVisaStatus(userData.visa_status),
        start_date: normalizeStartDate(userData.start_date) || new Date().toISOString().split('T')[0],
        work_environment: normalizeWorkEnvironment(userData.work_environment),
        languages_spoken: normalizeLanguage(userData.languages_spoken),
        company_types: normalizeCompanyType(userData.company_types),
        roles_selected: normalizeRole(userData.roles_selected),
        career_path: normalizeCareerPath(userData.career_path),
        entry_level_preference: normalizeEntryLevel(userData.entry_level_preference),
        target_cities: normalizeLocation(userData.target_cities),
    };
}
// Job data normalization - aligned with database schema
function normalizeJobData(jobData) {
    return {
        title: (0, jobMatching_1.reqString)(jobData.title),
        company: (0, jobMatching_1.reqString)(jobData.company),
        job_url: (0, jobMatching_1.reqString)(jobData.job_url),
        categories: (0, jobMatching_1.toStringArray)(jobData.categories),
        location: (0, jobMatching_1.reqString)(jobData.location), // Single string
        description: (0, jobMatching_1.reqString)(jobData.description), // Required string
        experience_required: (0, jobMatching_1.toOptString)(jobData.experience_required) || 'entry',
        work_environment: (0, jobMatching_1.toOptString)(jobData.work_environment) || 'unclear',
        source: (0, jobMatching_1.toOptString)(jobData.source) || 'unknown',
        job_hash: (0, jobMatching_1.reqString)(jobData.job_hash),
        posted_at: (0, jobMatching_1.toOptString)(jobData.posted_at) || new Date().toISOString(),
        language_requirements: (0, jobMatching_1.toStringArray)(jobData.language_requirements),
        scrape_timestamp: (0, jobMatching_1.toOptString)(jobData.scrape_timestamp) || new Date().toISOString(),
        created_at: (0, jobMatching_1.toOptString)(jobData.created_at) || new Date().toISOString(),
        updated_at: (0, jobMatching_1.toOptString)(jobData.updated_at) || new Date().toISOString(),
        freshness_tier: (0, jobMatching_1.toOptString)(jobData.freshness_tier) || 'recent',
        ai_labels: (0, jobMatching_1.toStringArray)(jobData.ai_labels),
        work_location: (0, jobMatching_1.toOptString)(jobData.work_location) || 'unclear',
        city: (0, jobMatching_1.toOptString)(jobData.city) || 'unknown',
        country: (0, jobMatching_1.toOptString)(jobData.country) || 'unknown',
        company_name: (0, jobMatching_1.toOptString)(jobData.company_name) || 'unknown',
    };
}
// Validation helpers
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function isValidDate(date) {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
}
// Sanitization helpers
function sanitizeString(input) {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return '';
}
function sanitizeArray(input) {
    if (Array.isArray(input)) {
        return input
            .filter((item) => typeof item === 'string')
            .map(sanitizeString)
            .filter(Boolean);
    }
    return [];
}
