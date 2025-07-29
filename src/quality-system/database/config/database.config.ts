/**
 * Database Configuration
 * 
 * Environment-specific database configurations for the Quality System.
 * Supports PostgreSQL for production and development environments.
 */

import { DatabaseManagerConfig } from '../DatabaseManager';

export interface EnvironmentConfig {
  development: DatabaseManagerConfig;
  test: DatabaseManagerConfig;
  production: DatabaseManagerConfig;
}

// Default configuration values
const defaultConfig = {
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  autoMigrate: true,
};

export const databaseConfig: EnvironmentConfig = {
  development: {
    ...defaultConfig,
    environment: 'development',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'quality_system_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
    autoMigrate: true,
  },

  test: {
    ...defaultConfig,
    environment: 'test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'quality_system_test',
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'password',
    ssl: false,
    maxConnections: 5, // Fewer connections for testing
    autoMigrate: true,
  },

  production: {
    ...defaultConfig,
    environment: 'production',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'quality_system',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '50'),
    autoMigrate: false, // Manual migrations in production
  },
};

/**
 * Get database configuration for the current environment
 */
export function getDatabaseConfig(environment?: string): DatabaseManagerConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  
  const config = databaseConfig[env as keyof EnvironmentConfig];
  if (!config) {
    throw new Error(`Database configuration not found for environment: ${env}`);
  }

  return config;
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseManagerConfig): void {
  const required = ['host', 'port', 'database', 'username'];
  
  for (const field of required) {
    if (!config[field as keyof DatabaseManagerConfig]) {
      throw new Error(`Database configuration missing required field: ${field}`);
    }
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid database port: ${config.port}`);
  }

  if (config.maxConnections && config.maxConnections < 1) {
    throw new Error(`Invalid max connections: ${config.maxConnections}`);
  }
}

/**
 * Create database URL from configuration (for external tools)
 */
export function createDatabaseUrl(config: DatabaseManagerConfig): string {
  const protocol = 'postgresql';
  const auth = config.password ? `${config.username}:${config.password}` : config.username;
  const sslParam = config.ssl ? '?sslmode=require' : '';
  
  return `${protocol}://${auth}@${config.host}:${config.port}/${config.database}${sslParam}`;
}

/**
 * Environment-specific connection pool settings
 */
export const poolSettings = {
  development: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  test: {
    min: 1,
    max: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 15000,
    destroyTimeoutMillis: 2000,
    idleTimeoutMillis: 10000,
    reapIntervalMillis: 500,
    createRetryIntervalMillis: 100,
  },

  production: {
    min: 5,
    max: 50,
    acquireTimeoutMillis: 120000,
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 10000,
    idleTimeoutMillis: 60000,
    reapIntervalMillis: 2000,
    createRetryIntervalMillis: 500,
  },
};

/**
 * Database feature flags
 */
export const databaseFeatures = {
  development: {
    enableQueryLogging: true,
    enableSlowQueryLogging: true,
    enableConnectionLogging: true,
    enableMigrationLogging: true,
    enableSeedData: true,
  },

  test: {
    enableQueryLogging: false,
    enableSlowQueryLogging: false,
    enableConnectionLogging: false,
    enableMigrationLogging: false,
    enableSeedData: true,
  },

  production: {
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    enableConnectionLogging: false,
    enableMigrationLogging: true,
    enableSeedData: false,
  },
};

/**
 * Get database features for environment
 */
export function getDatabaseFeatures(environment?: string) {
  const env = environment || process.env.NODE_ENV || 'development';
  return databaseFeatures[env as keyof typeof databaseFeatures] || databaseFeatures.development;
}