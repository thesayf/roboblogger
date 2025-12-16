# Required Vercel Environment Variables

You need to add these environment variables in your Vercel dashboard:

## Critical for Blog Generation:
1. `ANTHROPIC_API_KEY` - **MISSING** - This is causing the 500 error
   - Get your API key from https://console.anthropic.com/
   - This is required for the AI blog content generation

2. `NEXT_PUBLIC_BASE_URL` - Already added
   - Set to: https://schedulegenius.ai

## Optional but recommended:
3. `OPENAI_API_KEY` - For image analysis features (if using reference images)
4. `CRON_SECRET` - For securing cron endpoints (optional but recommended for production)

## How to add in Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with its value
5. Redeploy for changes to take effect

The 500 error you're seeing is because the blog generation endpoint can't find the ANTHROPIC_API_KEY.