/** @type {import('next').NextConfig} */

// Validate required environment variables at build time
if (process.env.NODE_ENV === 'production') {
  try {
    // Critical environment variables that must exist
    const requiredEnvs = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
      'FIREBASE_SERVICE_ACCOUNT',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'CRON_SECRET',
    ];

    // Optional environment variables (can have defaults)
    const optionalEnvs = [
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_BASE_URL',
    ];

    const missing = requiredEnvs.filter(env => !process.env[env]);
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(env => console.error(`   - ${env}`));
      process.exit(1);
    }

    // Warn about optional but recommended variables
    const missingOptional = optionalEnvs.filter(env => !process.env[env]);
    if (missingOptional.length > 0) {
      console.warn('⚠️  Missing optional environment variables (features may be limited):');
      missingOptional.forEach(env => console.warn(`   - ${env}`));
    }
  } catch (error) {
    console.error('Environment validation error:', error);
    process.exit(1);
  }
}

const nextConfig = {
  /**
   * Security headers to protect against common vulnerabilities
   * Applied globally to all routes
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Control which browser features can be used
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          // Enable XSS protection (legacy, but defensive)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
