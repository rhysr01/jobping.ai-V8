// QUICK AI MATCHING PATCH FOR YOUR API ROUTE
// Replace the callOpenAIForCluster function in your route.ts

async function callOpenAIForCluster_FIXED(userCluster, jobs, openai) {
  const user = userCluster[0];
  
  // FIXED: Much more explicit JSON-only prompt
  const prompt = `Return ONLY valid JSON array. No text, no markdown.

User needs: ${user.entry_level_preference || 'entry-level'} ${user.professional_expertise || ''} role in ${(user.target_cities || []).join(', ') || 'Europe'}

Jobs (pick best 3-5):
${jobs.slice(0, 8).map((job, i) => `${i+1}: ${job.title} at ${job.company} [${job.job_hash}] - ${job.location}`).join('\n')}

JSON format only:
[{
  "job_index": 1,
  "job_hash": "actual-hash-from-above",
  "match_score": 75,
  "match_reason": "Career match",
  "match_quality": "good"
}]`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use faster model
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Respond ONLY with valid JSON arrays. No explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 800    // Smaller limit
    });
    
    const response = completion.choices[0]?.message?.content || '';
    
    // FIXED: Better parsing with fallbacks
    let cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();
    
    // Extract JSON if buried in text
    const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    try {
      const matches = JSON.parse(cleaned);
      if (Array.isArray(matches) && matches.length > 0) {
        return matches.slice(0, 5).map(match => ({
          job_index: match.job_index,
          job_hash: match.job_hash,
          match_score: Math.min(100, Math.max(50, match.match_score || 60)),
          match_reason: match.match_reason || 'AI suggested match',
          match_quality: match.match_quality || 'fair',
          match_tags: match.match_tags || 'ai-match'
        }));
      }
    } catch (parseError) {
      console.error('JSON parse failed, response was:', cleaned.slice(0, 200));
    }
    
    // If all parsing fails, return empty array (will trigger fallback)
    return [];
    
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return [];
  }
}

// ALSO: Improved fallback for when AI completely fails
function improvedRuleBasedFallback(userCluster, jobs, results) {
  for (const user of userCluster) {
    console.log(`🔧 Rule-based fallback for ${user.email} with ${jobs.length} jobs`);
    
    const matches = [];
    const targetCities = user.target_cities || [];
    const userCareer = user.professional_expertise || '';
    
    // Score each job
    for (let i = 0; i < Math.min(jobs.length, 20); i++) {
      const job = jobs[i];
      let score = 50;
      let reasons = [];
      
      // Title-based scoring
      const title = job.title?.toLowerCase() || '';
      if (title.includes('junior') || title.includes('graduate') || title.includes('entry')) {
        score += 25;
        reasons.push('entry-level title');
      }
      
      if (title.includes('intern') || title.includes('trainee')) {
        score += 30;
        reasons.push('early-career role');
      }
      
      // Career matching
      if (userCareer) {
        const careerLower = userCareer.toLowerCase();
        if (title.includes(careerLower) || job.description?.toLowerCase().includes(careerLower)) {
          score += 20;
          reasons.push('career match');
        }
      }
      
      // Location matching
      if (targetCities.length > 0) {
        const location = job.location?.toLowerCase() || '';
        if (targetCities.some(city => location.includes(city.toLowerCase()))) {
          score += 15;
          reasons.push('location match');
        }
      }
      
      // Freshness (recent jobs get bonus)
      if (job.posted_at) {
        const daysDiff = (Date.now() - new Date(job.posted_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) {
          score += 10;
          reasons.push('recent posting');
        }
      }
      
      if (score >= 60) {
        matches.push({
          job_index: i + 1,
          job_hash: job.job_hash,
          match_score: score,
          match_reason: reasons.join(', ') || 'Rule-based match',
          match_quality: score >= 80 ? 'good' : 'fair',
          match_tags: 'rule-based'
        });
      }
    }
    
    // Sort by score and take top 6
    matches.sort((a, b) => b.match_score - a.match_score);
    results.set(user.email, matches.slice(0, 6));
    
    console.log(`✅ Rule-based fallback generated ${matches.slice(0, 6).length} matches for ${user.email}`);
  }
}

module.exports = {
  callOpenAIForCluster_FIXED,
  improvedRuleBasedFallback
};
