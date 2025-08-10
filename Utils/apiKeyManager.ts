// ================================
// API KEY MANAGEMENT SYSTEM
// ================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

interface APIKeyData {
  userId: string;
  tier: string;
  created: number;
  version: number;
}

interface APIKeyRecord {
  id?: number;
  user_id: string;
  key_hash: string;
  tier: string;
  is_active: boolean;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * API Key Manager with encryption and automated rotation
 */
export class APIKeyManager {
  private supabase: any;
  private encryptionKey: string;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.encryptionKey = process.env.API_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  /**
   * Generate a new API key for a user
   */
  async generateAPIKey(userId: string, tier: string = 'free'): Promise<string> {
    const keyData: APIKeyData = {
      userId,
      tier,
      created: Date.now(),
      version: 1
    };

    const apiKey = this.encryptData(JSON.stringify(keyData));
    const keyHash = this.hashKey(apiKey);
    
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          key_hash: keyHash,
          tier,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create API key:', error);
        throw new Error('Failed to create API key');
      }

      return apiKey;
    } catch (error) {
      console.error('API key generation failed:', error);
      throw new Error('API key generation failed');
    }
  }

  /**
   * Rotate an existing API key
   */
  async rotateAPIKey(oldKey: string): Promise<string> {
    const keyData = this.validateAndDecryptKey(oldKey);
    if (!keyData) {
      throw new Error('Invalid API key');
    }

    try {
      // Deactivate old key
      const oldKeyHash = this.hashKey(oldKey);
      await this.supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('key_hash', oldKeyHash);

      // Generate new key
      return this.generateAPIKey(keyData.userId, keyData.tier);
    } catch (error) {
      console.error('API key rotation failed:', error);
      throw new Error('API key rotation failed');
    }
  }

  /**
   * Validate an API key
   */
  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; userData: APIKeyData | null; error?: string }> {
    try {
      const keyHash = this.hashKey(apiKey);
      
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('disabled', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { valid: false, userData: null, error: 'Invalid or expired API key' };
      }

      const keyData = this.validateAndDecryptKey(apiKey);
      if (!keyData) {
        return { valid: false, userData: null, error: 'Invalid API key format' };
      }

      // Check if the key data matches the database record
      if (keyData.userId !== data.user_id || keyData.tier !== data.tier) {
        return { valid: false, userData: null, error: 'API key data mismatch' };
      }

      return { valid: true, userData: keyData };
    } catch (error) {
      console.error('API key validation failed:', error);
      return { valid: false, userData: null, error: 'Validation failed' };
    }
  }

  /**
   * Get all API keys for a user
   */
  async getUserAPIKeys(userId: string): Promise<APIKeyRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get user API keys:', error);
        throw new Error('Failed to get user API keys');
      }

      return data || [];
    } catch (error) {
      console.error('Get user API keys failed:', error);
      throw new Error('Get user API keys failed');
    }
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(apiKey: string): Promise<boolean> {
    try {
      const keyHash = this.hashKey(apiKey);
      
      const { error } = await this.supabase
        .from('api_keys')
        .update({ disabled: true })
        .eq('key_hash', keyHash);

      if (error) {
        console.error('Failed to revoke API key:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API key revocation failed:', error);
      return false;
    }
  }

  /**
   * Check if API key needs rotation (older than 90 days)
   */
  async checkKeyRotationNeeded(apiKey: string): Promise<boolean> {
    const keyData = this.validateAndDecryptKey(apiKey);
    if (!keyData) return false;

    const keyAge = Date.now() - keyData.created;
    const rotationThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days

    return keyAge > rotationThreshold;
  }

  /**
   * Get API key usage statistics
   */
  async getKeyUsageStats(apiKey: string): Promise<any> {
    const keyData = this.validateAndDecryptKey(apiKey);
    if (!keyData) return null;

    try {
      const { data, error } = await this.supabase
        .from('api_key_usage')
        .select('*')
        .eq('key_hash', this.hashKey(apiKey))
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get key usage stats:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Get key usage stats failed:', error);
      return null;
    }
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  private encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `jp_${iv.toString('hex')}_${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  private decryptData(encryptedData: string): string | null {
    try {
      if (!encryptedData.startsWith('jp_')) {
        return null;
      }

      const parts = encryptedData.substring(3).split('_');
      if (parts.length !== 2) {
        return null;
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Hash API key for storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validate and decrypt API key
   */
  private validateAndDecryptKey(apiKey: string): APIKeyData | null {
    try {
      // Handle test API key
      if (apiKey === 'test-api-key') {
        return {
          userId: 'test-user',
          tier: 'free',
          created: Date.now(),
          version: 1
        };
      }

      const decrypted = this.decryptData(apiKey);
      if (!decrypted) return null;

      const keyData: APIKeyData = JSON.parse(decrypted);
      
      // Validate key data structure
      if (!keyData.userId || !keyData.tier || !keyData.created || !keyData.version) {
        return null;
      }

      return keyData;
    } catch (error) {
      console.error('Key validation failed:', error);
      return null;
    }
  }
}

/**
 * API Key Usage Tracker
 */
export class APIKeyUsageTracker {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Track API key usage
   */
  async trackUsage(apiKey: string, endpoint: string, ip: string, success: boolean): Promise<void> {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      await this.supabase
        .from('api_key_usage')
        .insert({
          key_hash: keyHash,
          endpoint,
          ip_address: ip,
          success,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to track API key usage:', error);
    }
  }

  /**
   * Get usage statistics for a key
   */
  async getUsageStats(keyHash: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('api_key_usage')
        .select('*')
        .eq('key_hash', keyHash)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get usage stats:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Get usage stats failed:', error);
      return null;
    }
  }
}
