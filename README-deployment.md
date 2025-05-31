# Deployment Guide for Slimify 3000

## Environment Variables Setup

This app uses AI services for food and exercise recognition. You need to set up environment variables for the API keys.

### Required Environment Variables

```bash
# Choose either 'gemini' or 'claude'
VITE_AI_PROVIDER=gemini

# Google Gemini API Key (if using Gemini)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Anthropic Claude API Key (if using Claude)
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

### Getting API Keys

#### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with "AIza...")

#### Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/account/keys)
2. Create an account or sign in
3. Navigate to API Keys section
4. Click "Create Key"
5. Copy the API key (starts with "sk-ant-...")

### Deploying to Netlify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Log in to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `build`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Click "Add a variable"
   - Add each variable:
     - Key: `VITE_AI_PROVIDER`
     - Value: `gemini` (or `claude`)
     - Scopes: All (Production, Deploy Previews, Branch deploys, Local development)
   - Repeat for your chosen API key:
     - Key: `VITE_GEMINI_API_KEY` or `VITE_CLAUDE_API_KEY`
     - Value: Your actual API key
     - Scopes: Production only (for security)

4. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete
   - Your app will be live at the provided Netlify URL

### Security Notes

- API keys are stored as environment variables on Netlify's servers
- They are only accessible during the build process and server-side execution
- Never commit API keys to your Git repository
- Consider setting API keys only for production scope to prevent exposure in preview deployments

### Testing Locally

To test with environment variables locally:

1. Create a `.env` file in your project root:
   ```bash
   VITE_AI_PROVIDER=gemini
   VITE_GEMINI_API_KEY=your_test_key_here
   ```

2. Add `.env` to your `.gitignore` file (if not already there)

3. Run the development server:
   ```bash
   npm run dev
   ```

The app will use the local environment variables for testing. 