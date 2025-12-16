# Vercel Deployment Checklist for Blog Scheduler

## Environment Variables to Set in Vercel Dashboard

1. **Required for Blog Generation:**
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `OPENAI_API_KEY` - Your OpenAI API key (for image analysis)
   - `MONGODB_URI` - Your MongoDB connection string
   - `IMAGEKIT_PUBLIC_KEY` - ImageKit public key
   - `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
   - `IMAGEKIT_URL_ENDPOINT` - ImageKit URL endpoint

2. **Required for Authentication:**
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - All other Clerk environment variables from .env.local

3. **Optional but Recommended:**
   - `CRON_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., https://your-app.vercel.app)

## Vercel Configuration

1. **Function Timeout:**
   - The cron job has `maxDuration = 60` seconds
   - Blog generation has `maxDuration = 300` seconds
   - You need Vercel Pro plan for timeouts > 10 seconds
   - If on free plan, consider reducing concurrent processing

2. **Cron Jobs:**
   - Already configured in vercel.json
   - Runs every 5 minutes
   - Vercel automatically adds authentication header

## Testing After Deployment

1. **Check Cron Status:**
   - Go to Vercel Dashboard > Your Project > Functions > Cron
   - You should see the cron job listed there
   - Check execution logs

2. **Manual Test:**
   - Visit: `https://your-app.vercel.app/api/debug/time`
   - Verify server time is correct

3. **Create Test Topic:**
   - Schedule a topic 5-10 minutes in the future
   - Wait for cron execution
   - Check if blog post is generated

## Common Issues and Solutions

1. **Timeout Errors:**
   - Solution: Upgrade to Vercel Pro or reduce processing complexity
   - Alternative: Process fewer topics per cron run

2. **Authentication Errors:**
   - Ensure all API keys are correctly set in Vercel
   - Check for typos or missing values

3. **Base URL Issues:**
   - Set `NEXT_PUBLIC_BASE_URL` to your production URL
   - Without it, internal API calls might fail

4. **Timezone Issues:**
   - Vercel servers run in UTC
   - The app handles timezone conversion automatically
   - Users see their local time, server stores UTC

## Monitoring

1. **Vercel Functions Tab:**
   - Monitor execution logs
   - Check for errors or timeouts

2. **Debug Endpoints:**
   - `/api/debug/time` - Check server time
   - `/api/debug/failed-topics` - Check failed generations
   - `/api/cron/process-scheduled-topics` - Manually trigger (with auth)

3. **Scheduler Tab:**
   - Shows real-time status of all topics
   - Displays failures and retry attempts