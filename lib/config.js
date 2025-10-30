import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Configuration manager for Figma Browser
 * Handles user settings, tokens, and preferences
 */
class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.figma-browser');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      version: '1.0.0',
      settings: {
        port: 3000,
        autoOpenBrowser: true,
        theme: 'light'
      },
      tokens: {},
      teams: {},
      lastUsed: {
        token: null,
        teamId: null
      }
    };
    
    this.ensureConfigExists();
  }

  /**
   * Ensure config directory and file exist
   */
  ensureConfigExists() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.configFile)) {
        this.saveConfig(this.defaultConfig);
      }
    } catch (error) {
      console.warn('⚠️  Could not create config directory:', error.message);
    }
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        return { ...this.defaultConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      console.warn('⚠️  Could not load config, using defaults:', error.message);
    }
    return this.defaultConfig;
  }

  /**
   * Save configuration to file
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Could not save config:', error.message);
      return false;
    }
  }

  /**
   * Get a configuration value
   */
  get(key, defaultValue = null) {
    const config = this.loadConfig();
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a configuration value
   */
  set(key, value) {
    const config = this.loadConfig();
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = config;
    
    for (const k of keys) {
      if (!target[k]) target[k] = {};
      target = target[k];
    }
    
    target[lastKey] = value;
    return this.saveConfig(config);
  }

  /**
   * Save token with optional alias
   */
  saveToken(token, alias = null, teamId = null) {
    const config = this.loadConfig();
    const tokenKey = alias || `token_${Date.now()}`;
    
    config.tokens[tokenKey] = {
      token,
      teamId,
      createdAt: new Date().toISOString(),
      alias
    };
    
    // Update last used
    config.lastUsed.token = token;
    config.lastUsed.teamId = teamId;
    
    return this.saveConfig(config);
  }

  /**
   * Get saved tokens
   */
  getTokens() {
    return this.get('tokens', {});
  }

  /**
   * Get last used credentials
   */
  getLastUsed() {
    return this.get('lastUsed', { token: null, teamId: null });
  }

  /**
   * Clear all saved data
   */
  clearAll() {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
      this.ensureConfigExists();
      return true;
    } catch (error) {
      console.error('❌ Could not clear config:', error.message);
      return false;
    }
  }

  /**
   * Get config file path for user reference
   */
  getConfigPath() {
    return this.configFile;
  }
}

export default ConfigManager;