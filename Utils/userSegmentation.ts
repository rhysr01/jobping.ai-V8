// ================================
// ADVANCED USER SEGMENTATION SYSTEM
// ================================

import { createClient } from '@supabase/supabase-js';

/**
 * Advanced user segmentation system for smart insights and behavior analysis
 */
export class UserSegmentationOracle {
  
  /**
   * Analyze user behavior and segment users
   */
  static async analyzeUserBehavior(supabase: any) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch users for segmentation:', error);
        return { error: error.message };
      }

      const segments = {
        highEngagement: users.filter((u: any) => this.isHighEngagement(u)),
        premiumCandidates: users.filter((u: any) => this.isPremiumCandidate(u)),
        atRisk: users.filter((u: any) => this.isAtRisk(u)),
        newGraduates: users.filter((u: any) => this.isNewGraduate(u)),
        activeJobSeekers: users.filter((u: any) => this.isActiveJobSeeker(u)),
        passiveCandidates: users.filter((u: any) => this.isPassiveCandidate(u))
      };

      console.log(`👥 User Segmentation Analysis:
        High Engagement: ${segments.highEngagement.length}
        Premium Candidates: ${segments.premiumCandidates.length}
        At Risk: ${segments.atRisk.length}
        New Graduates: ${segments.newGraduates.length}
        Active Job Seekers: ${segments.activeJobSeekers.length}
        Passive Candidates: ${segments.passiveCandidates.length}
        Total Users: ${users.length}
      `);

      return {
        segments,
        totalUsers: users.length,
        segmentDistribution: this.calculateSegmentDistribution(segments),
        insights: await this.generateInsights(segments, users)
      };
    } catch (error) {
      console.error('User segmentation analysis failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Check if user is highly engaged
   */
  static isHighEngagement(user: any): boolean {
    // Logic based on email opens, clicks, applications, recent activity
    const daysSinceCreated = this.getDaysSinceCreated(user.created_at);
    const hasRecentActivity = daysSinceCreated < 7;
    const hasCompleteProfile = this.hasCompleteProfile(user);
    const hasMultiplePreferences = this.hasMultiplePreferences(user);
    
    return hasRecentActivity && hasCompleteProfile && hasMultiplePreferences;
  }

  /**
   * Check if user is a premium candidate
   */
  static isPremiumCandidate(user: any): boolean {
    // Users who might upgrade to premium
    const premiumIndicators = [
      user.company_types?.includes('Tech Giants') || 
      user.company_types?.includes('FAANG') ||
      user.target_cities?.includes('London') ||
      user.target_cities?.includes('New York') ||
      user.target_cities?.includes('San Francisco') ||
      user.career_path?.includes('strategy') ||
      user.career_path?.includes('product') ||
      user.career_path?.includes('data-analytics') ||
      user.professional_expertise?.includes('Engineering') ||
      user.professional_expertise?.includes('Computer Science')
    ];

    return premiumIndicators.some(indicator => indicator);
  }

  /**
   * Check if user is at risk of churning
   */
  static isAtRisk(user: any): boolean {
    const daysSinceCreated = this.getDaysSinceCreated(user.created_at);
    const hasNoRecentActivity = daysSinceCreated > 14; // No engagement after 2 weeks
    const hasIncompleteProfile = !this.hasCompleteProfile(user);
    const hasNoPreferences = !this.hasMultiplePreferences(user);
    
    return hasNoRecentActivity || hasIncompleteProfile || hasNoPreferences;
  }

  /**
   * Check if user is a new graduate
   */
  static isNewGraduate(user: any): boolean {
    return user.entry_level_preference?.includes('Graduate') ||
           user.entry_level_preference?.includes('Internship') ||
           user.entry_level_preference?.includes('Entry Level') ||
           user.career_path?.includes('graduate') ||
           this.getDaysSinceCreated(user.created_at) < 30;
  }

  /**
   * Check if user is an active job seeker
   */
  static isActiveJobSeeker(user: any): boolean {
    const daysSinceCreated = this.getDaysSinceCreated(user.created_at);
    const hasRecentActivity = daysSinceCreated < 7;
    const hasUrgentStartDate = this.hasUrgentStartDate(user);
    const hasMultipleTargetCities = this.hasMultipleTargetCities(user);
    
    return hasRecentActivity && (hasUrgentStartDate || hasMultipleTargetCities);
  }

  /**
   * Check if user is a passive candidate
   */
  static isPassiveCandidate(user: any): boolean {
    const daysSinceCreated = this.getDaysSinceCreated(user.created_at);
    const hasDistantStartDate = this.hasDistantStartDate(user);
    const hasSpecificPreferences = this.hasSpecificPreferences(user);
    
    return daysSinceCreated > 30 && hasDistantStartDate && hasSpecificPreferences;
  }

  /**
   * Calculate segment distribution
   */
  static calculateSegmentDistribution(segments: any) {
    const total = Object.values(segments).reduce((sum: number, segment: any) => sum + segment.length, 0);
    
    return Object.entries(segments).reduce((acc: any, [key, segment]: [string, any]) => {
      acc[key] = {
        count: segment.length,
        percentage: total > 0 ? Math.round((segment.length / total) * 100) : 0
      };
      return acc;
    }, {});
  }

  /**
   * Generate insights from user segments
   */
  static async generateInsights(segments: any, users: any[]) {
    const insights = [];

    // High engagement insights
    if (segments.highEngagement.length > 0) {
      insights.push({
        type: 'engagement',
        message: `${segments.highEngagement.length} users (${Math.round((segments.highEngagement.length / users.length) * 100)}%) are highly engaged`,
        recommendation: 'Focus on retaining these users and encouraging referrals',
        priority: 'high'
      });
    }

    // Premium candidate insights
    if (segments.premiumCandidates.length > 0) {
      insights.push({
        type: 'revenue',
        message: `${segments.premiumCandidates.length} users (${Math.round((segments.premiumCandidates.length / users.length) * 100)}%) are premium candidates`,
        recommendation: 'Target these users for premium upgrade campaigns',
        priority: 'high'
      });
    }

    // At-risk insights
    if (segments.atRisk.length > 0) {
      insights.push({
        type: 'retention',
        message: `${segments.atRisk.length} users (${Math.round((segments.atRisk.length / users.length) * 100)}%) are at risk of churning`,
        recommendation: 'Implement re-engagement campaigns and improve onboarding',
        priority: 'critical'
      });
    }

    // New graduate insights
    if (segments.newGraduates.length > 0) {
      insights.push({
        type: 'growth',
        message: `${segments.newGraduates.length} users (${Math.round((segments.newGraduates.length / users.length) * 100)}%) are new graduates`,
        recommendation: 'Provide targeted content and mentorship opportunities',
        priority: 'medium'
      });
    }

    return insights;
  }

  /**
   * Get days since user was created
   */
  static getDaysSinceCreated(createdAt: string): number {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if user has complete profile
   */
  static hasCompleteProfile(user: any): boolean {
    const requiredFields = [
      'full_name',
      'email',
      'professional_expertise',
      'target_cities',
      'career_path'
    ];

    return requiredFields.every(field => {
      const value = user[field];
      if (Array.isArray(value)) {
        return value.length > 0 && value.some((item: string) => item && item.trim() !== '');
      }
      return value && value.trim() !== '';
    });
  }

  /**
   * Check if user has multiple preferences
   */
  static hasMultiplePreferences(user: any): boolean {
    const preferences = [
      user.target_cities,
      user.company_types,
      user.roles_selected,
      user.languages_spoken
    ];

    return preferences.some(pref => {
      if (Array.isArray(pref)) {
        return pref.length > 1;
      }
      return pref && pref.includes(',');
    });
  }

  /**
   * Check if user has urgent start date
   */
  static hasUrgentStartDate(user: any): boolean {
    const startDate = user.start_date;
    if (!startDate) return false;

    const urgentKeywords = ['immediately', 'asap', 'urgent', 'now', 'ready'];
    return urgentKeywords.some(keyword => 
      startDate.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if user has distant start date
   */
  static hasDistantStartDate(user: any): boolean {
    const startDate = user.start_date;
    if (!startDate) return false;

    const distantKeywords = ['later', 'future', 'next year', '2025', 'flexible'];
    return distantKeywords.some(keyword => 
      startDate.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if user has multiple target cities
   */
  static hasMultipleTargetCities(user: any): boolean {
    if (Array.isArray(user.target_cities)) {
      return user.target_cities.length > 1;
    }
    return user.target_cities && user.target_cities.includes(',');
  }

  /**
   * Check if user has specific preferences
   */
  static hasSpecificPreferences(user: any): boolean {
    const specificFields = [
      user.company_types,
      user.roles_selected,
      user.career_path
    ];

    return specificFields.some(field => {
      if (Array.isArray(field)) {
        return field.length > 0 && field.some((item: string) => item && item.trim() !== '');
      }
      return field && field.trim() !== '';
    });
  }

  /**
   * Get user engagement score
   */
  static calculateEngagementScore(user: any): number {
    let score = 0;

    // Profile completeness (0-30 points)
    if (this.hasCompleteProfile(user)) score += 30;

    // Recent activity (0-25 points)
    const daysSinceCreated = this.getDaysSinceCreated(user.created_at);
    if (daysSinceCreated < 7) score += 25;
    else if (daysSinceCreated < 30) score += 15;
    else if (daysSinceCreated < 90) score += 5;

    // Multiple preferences (0-20 points)
    if (this.hasMultiplePreferences(user)) score += 20;

    // Specific preferences (0-15 points)
    if (this.hasSpecificPreferences(user)) score += 15;

    // Premium indicators (0-10 points)
    if (this.isPremiumCandidate(user)) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Get comprehensive user analysis
   */
  static async getUserAnalysis(userId: string, supabase: any) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { error: 'User not found' };
      }

      const analysis = {
        user,
        segments: {
          highEngagement: this.isHighEngagement(user),
          premiumCandidate: this.isPremiumCandidate(user),
          atRisk: this.isAtRisk(user),
          newGraduate: this.isNewGraduate(user),
          activeJobSeeker: this.isActiveJobSeeker(user),
          passiveCandidate: this.isPassiveCandidate(user)
        },
        engagementScore: this.calculateEngagementScore(user),
        daysSinceCreated: this.getDaysSinceCreated(user.created_at),
        profileCompleteness: this.hasCompleteProfile(user),
        recommendations: this.getUserRecommendations(user)
      };

      return analysis;
    } catch (error) {
      console.error('User analysis failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Get personalized recommendations for user
   */
  static getUserRecommendations(user: any) {
    const recommendations = [];

    if (!this.hasCompleteProfile(user)) {
      recommendations.push({
        type: 'profile',
        message: 'Complete your profile to get better job matches',
        priority: 'high'
      });
    }

    if (this.isAtRisk(user)) {
      recommendations.push({
        type: 'engagement',
        message: 'Stay active to get the latest job opportunities',
        priority: 'critical'
      });
    }

    if (this.isPremiumCandidate(user)) {
      recommendations.push({
        type: 'upgrade',
        message: 'Consider upgrading to premium for advanced features',
        priority: 'medium'
      });
    }

    if (this.isNewGraduate(user)) {
      recommendations.push({
        type: 'content',
        message: 'Check out our graduate resources and mentorship programs',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}
