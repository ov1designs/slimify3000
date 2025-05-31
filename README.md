# Slimify 3000 🎯

An AI-powered calorie and weight tracker built with SvelteKit, focusing on privacy with local data storage.

## Features ✨

### Core Functionality
- 🤖 AI-powered food and exercise logging via server-side API
- 📊 Dynamic zigzag calorie cycling
- 📈 Weekly analytics with charts
- 🎯 Monthly insights
- 🌙 Dark mode support
- 🔒 Privacy-first: All user data stored locally

### User Experience
- **Conversational Interface**: Chat-based food and exercise logging
- **Weekly Analytics**: Visual charts and detailed breakdowns
- **Monthly Insights**: AI-generated summaries with actionable recommendations
- **Progress Tracking**: Weight history with milestone celebrations
- **Dark Mode**: Full dark mode support with system preference detection

## Tech Stack 🛠️

- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: IndexedDB (via idb)
- **Charts**: Chart.js
- **AI**: Google Gemini or Anthropic Claude (server-side)
- **Deployment**: Netlify

## Getting Started 🚀

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- API key for either Google Gemini or Anthropic Claude

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/slimify-3000.git
cd slimify-3000
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file for local development:
```bash
VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

This app is configured for deployment on Netlify. See [README-deployment.md](README-deployment.md) for detailed deployment instructions.

### Quick Deploy to Netlify

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Set environment variables in Netlify:
   - `VITE_AI_PROVIDER` (either 'gemini' or 'claude')
   - `VITE_GEMINI_API_KEY` or `VITE_CLAUDE_API_KEY`
4. Deploy!

## Usage Guide ��

### Initial Setup
1. Complete the 3-step onboarding to set up your profile
2. Your personalized calorie targets will be calculated automatically
3. Weekly "zigzag" cycling plan will be generated

### Daily Use
1. **Log Food**: Use the chat interface or type naturally
   - "I had 2 eggs and toast for breakfast"
   - "Just ate a chicken salad sandwich"

2. **Log Exercise**: Same conversational interface
   - "Ran for 30 minutes"
   - "Did 45 minutes of yoga"

3. **Track Progress**: View real-time calorie balance and safety indicators

### Features Overview

#### Dashboard
- Real-time calorie ring showing daily progress
- Net calorie display with safety indicators
- Quick action buttons for common tasks
- Today's meals and exercises summary

#### Chat Logger
- Natural language processing for food/exercise
- Quick example buttons
- Automatic calorie estimation
- Meal type detection

#### Weekly View
- Interactive bar chart
- Daily breakdown table
- Weekly statistics
- Goal progress tracking

#### Monthly Insights
- AI-generated analysis
- Achievement recognition
- Pattern identification
- Personalized recommendations

#### Settings
- Profile management
- Theme preferences
- Data export/import
- Reset functionality

## Project Structure 📁

```
src/
├── lib/
│   ├── components/     # Reusable components
│   ├── services/       # Database service
│   ├── stores/         # Svelte stores
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── routes/
│   ├── api/           # Server-side API routes
│   │   └── ai/        # AI processing endpoints
│   ├── chat/          # Food/exercise logging
│   ├── weekly/        # Weekly analytics
│   ├── insights/      # Monthly insights
│   └── settings/      # User settings
└── app.html           # App template
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run check

# Format code
npm run format

# Lint code
npm run lint
```

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- Built with [SvelteKit](https://kit.svelte.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Charts by [Chart.js](https://www.chartjs.org/)
- Icons from native emoji

---

Made with ❤️ for healthier living
