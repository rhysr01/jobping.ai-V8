#!/usr/bin/env node

/**
 * ENGAGEMENT STATISTICS CHECKER
 * Checks user engagement statistics and identifies inactive users
 */

const { getDatabaseClient } = require('../Utils/databasePool');

async function checkEngagementStats() {
  try {
    console.log('📊 Checking JobPing Engagement Statistics...\n');
    
    const supabase = getDatabaseClient();
    
    // Get total users
    const { data: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('email', { count: 'exact' })
      .eq('active', true)
      .eq('email_verified', true);
    
    if (totalError) {
      console.error('❌ Error getting total users:', totalError);
      return;
    }
    
    // Get engaged users (score >= 30, not paused)
    const { data: engagedUsers, error: engagedError } = await supabase
      .from('users')
      .select('email', { count: 'exact' })
      .eq('active', true)
      .eq('email_verified', true)
      .gte('email_engagement_score', 30)
      .eq('delivery_paused', false);
    
    // Get paused users
    const { data: pausedUsers, error: pausedError } = await supabase
      .from('users')
      .select('email', { count: 'exact' })
      .eq('active', true)
      .eq('email_verified', true)
      .eq('delivery_paused', true);
    
    // Get users for re-engagement
    const { data: reEngagementUsers, error: reEngagementError } = await supabase
      .from('users')
      .select('email, full_name, last_engagement_date, email_engagement_score')
      .eq('active', true)
      .eq('email_verified', true)
      .eq('delivery_paused', true)
      .eq('re_engagement_sent', false)
      .lt('last_engagement_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    // Get engagement score distribution
    const { data: scoreDistribution, error: scoreError } = await supabase
      .from('users')
      .select('email_engagement_score')
      .eq('active', true)
      .eq('email_verified', true);
    
    console.log('📈 ENGAGEMENT STATISTICS:');
    console.log(`   Total active users: ${totalUsers?.length || 0}`);
    console.log(`   Engaged users (score ≥30): ${engagedUsers?.length || 0}`);
    console.log(`   Paused users: ${pausedUsers?.length || 0}`);
    console.log(`   Re-engagement candidates: ${reEngagementUsers?.length || 0}`);
    
    if (reEngagementUsers && reEngagementUsers.length > 0) {
      console.log('\n👥 USERS NEEDING RE-ENGAGEMENT:');
      reEngagementUsers.forEach((user, index) => {
        const daysSinceEngagement = user.last_engagement_date 
          ? Math.floor((Date.now() - new Date(user.last_engagement_date).getTime()) / (24 * 60 * 60 * 1000))
          : 'Unknown';
        console.log(`   ${index + 1}. ${user.email} (${user.full_name || 'No name'}) - Score: ${user.email_engagement_score}, Last engagement: ${daysSinceEngagement} days ago`);
      });
    }
    
    // Calculate engagement score distribution
    if (scoreDistribution && scoreDistribution.length > 0) {
      const scores = scoreDistribution.map(u => u.email_engagement_score).filter(s => s !== null);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const highEngagement = scores.filter(s => s >= 70).length;
      const mediumEngagement = scores.filter(s => s >= 30 && s < 70).length;
      const lowEngagement = scores.filter(s => s < 30).length;
      
      console.log('\n📊 ENGAGEMENT SCORE DISTRIBUTION:');
      console.log(`   Average score: ${avgScore.toFixed(1)}`);
      console.log(`   High engagement (≥70): ${highEngagement} users`);
      console.log(`   Medium engagement (30-69): ${mediumEngagement} users`);
      console.log(`   Low engagement (<30): ${lowEngagement} users`);
    }
    
    // Calculate potential volume reduction
    const totalActive = totalUsers?.length || 0;
    const paused = pausedUsers?.length || 0;
    const volumeReduction = totalActive > 0 ? ((paused / totalActive) * 100).toFixed(1) : 0;
    
    console.log('\n💡 VOLUME REDUCTION ANALYSIS:');
    console.log(`   Current volume reduction: ${volumeReduction}%`);
    console.log(`   Users paused: ${paused} out of ${totalActive}`);
    
    if (parseFloat(volumeReduction) >= 20) {
      console.log('   ✅ Excellent! You\'re reducing email volume by 20%+ through engagement filtering');
    } else if (parseFloat(volumeReduction) >= 10) {
      console.log('   ✅ Good! You\'re reducing email volume by 10%+ through engagement filtering');
    } else {
      console.log('   📈 Consider running re-engagement campaigns to identify more inactive users');
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (reEngagementUsers && reEngagementUsers.length > 0) {
      console.log(`   1. Send re-engagement emails to ${reEngagementUsers.length} inactive users`);
      console.log('   2. Monitor engagement scores over the next week');
      console.log('   3. Consider adjusting the engagement threshold if needed');
    } else {
      console.log('   1. All users are currently engaged or have been contacted');
      console.log('   2. Monitor new user engagement patterns');
      console.log('   3. Consider running A/B tests on email frequency');
    }
    
  } catch (error) {
    console.error('❌ Failed to check engagement stats:', error);
    process.exit(1);
  }
}

// Run the engagement stats check
checkEngagementStats();
