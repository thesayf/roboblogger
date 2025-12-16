# Deployment Steps

## Environment Variable to Add in Vercel

Add this environment variable in your Vercel dashboard:

```
NEXT_PUBLIC_BASE_URL=https://www.schedulegenius.ai
```

**Important**: Include the `www` subdomain since that's your primary domain.

This is required for internal API calls to work properly in the Vercel serverless environment.

## What was fixed:
1. Fixed operator precedence in baseUrl calculation
2. Ensured all internal API calls use the same baseUrl logic
3. Added proper URL construction for Vercel's serverless environment

The issue was that `process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'` was being evaluated as the second option in the OR statement, causing it to always use the VERCEL_URL when available (which might be a preview URL instead of your production domain).