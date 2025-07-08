# FlightRadar24 API Setup Guide

## Getting Your API Key

FlightAbove now supports real flight data through the FlightRadar24 API. Follow these steps to get your API key and start receiving live flight information.

### Step 1: Visit FlightRadar24 API Website

1. Go to [FlightRadar24 API](https://fr24api.flightradar24.com/)
2. Click "Get Started" or "Sign Up"

### Step 2: Create an Account

1. Register for a new account or log in if you already have one
2. Verify your email address if required

### Step 3: Choose a Plan

FlightRadar24 offers several API plans:

- **Free Tier**: Limited requests per month (great for testing)
- **Basic Plan**: More requests, suitable for personal use
- **Pro Plan**: Higher limits for commercial applications

Choose the plan that best fits your needs.

### Step 4: Get Your API Key

1. Once subscribed, go to your API dashboard
2. Find your API key (usually under "API Keys" or "Credentials")
3. Copy the API key string

### Step 5: Add API Key to FlightAbove

1. Open FlightAbove from your menu bar
2. Click the settings button (⚙️) in the bottom right
3. Paste your API key in the "FlightRadar24 API Key" field
4. Click "Save API Key"

## What Changes With Real API

### With API Key (Real Data)
- ✅ Live flight data from FlightRadar24
- ✅ Accurate flight positions and altitudes
- ✅ Real airline information and flight numbers
- ✅ Actual flight status (on-time, delayed, cancelled)
- ✅ Current aircraft information

### Without API Key (No Flights)
- ❌ No flight data shown
- 💡 Menu bar shows "✈️" icon only
- 📱 App displays "No flights overhead"

## API Features Used

FlightAbove uses the following FlightRadar24 API features:

- **Live Flight Positions (Light)**: Real-time flight tracking data within geographic bounds
- **Geographic Filtering**: Find flights within a specific area around your location
- **Flight Details**: Get comprehensive information including airline, flight number, origin, destination, altitude, and speed
- **Real-time Updates**: Refresh data every 30 seconds

## API Rate Limits

- Be mindful of your plan's rate limits
- FlightAbove refreshes data every 30 seconds to conserve API calls
- If you exceed rate limits, no flights will be shown until the limit resets

## Troubleshooting

### "API key is invalid or expired" (401 Unauthorized)
- Check that you copied the API key correctly
- Verify your FlightRadar24 account is active
- Ensure your subscription hasn't expired

### "Insufficient credits" (402 Payment Required)
- Check your FlightRadar24 account balance
- Top up your account or upgrade your plan
- No flights will be shown when credits are exhausted

### "API endpoint not found" (404 Not Found)
- This should now be fixed with the latest version
- If you still see this error, the API URL may have changed
- Check the FlightRadar24 API documentation for updates

### "API rate limit exceeded" (429 Too Many Requests)
- Wait for the rate limit to reset
- Consider upgrading to a higher tier plan
- No flights will be shown until the rate limit resets

### "No flights found" or blank display
- This is normal if there are no flights in your area
- Without an API key, no flights will be shown at all
- With an API key but no flights overhead, you'll see "No flights overhead"
- Try again later when flights are in your area

## Security

- Your API key is stored securely using Electron's encrypted storage
- The key is never transmitted outside of direct API calls to FlightRadar24
- You can remove the API key anytime through the settings panel

## Support

For API-related issues:
- Check the [FlightRadar24 API Documentation](https://fr24api.flightradar24.com/docs/)
- Contact FlightRadar24 support for account issues

For FlightAbove app issues:
- Check the GitHub repository for troubleshooting
- Report bugs through the issue tracker 