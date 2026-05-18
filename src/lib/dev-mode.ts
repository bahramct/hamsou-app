/**
 * Development Mode Helper
 *
 * This utility provides functions to check if the application is running in development mode.
 * Use this to protect development-only features from running in production.
 */

/**
 * Check if the current environment is development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the current environment is production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if the current environment is test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Guard function - throws an error if not in development mode
 * Use this in API routes to protect dev-only endpoints
 */
export function requireDevelopment(): void {
  if (!isDevelopment()) {
    throw new Error('This endpoint is only available in development mode');
  }
}

/**
 * Get the current environment name
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}
