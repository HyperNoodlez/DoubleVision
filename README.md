# DoubleVision 📸

A Wordle-style daily photography feedback web app where users upload one photo per day, review 5 random photos to unlock their own feedback, and compete via an ELO-based rating system.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)

## Features

- 📷 **Daily Photo Upload** - Upload one photo per day
- ⭐ **Review System** - Review 5 random photos to unlock feedback on your own
- 🏆 **ELO Rating** - Competitive rating system based on review quality
- 🤖 **AI Moderation** - Google Gemini AI moderates all reviews
- 🔐 **OAuth Authentication** - Sign in with Google or GitHub
- 🎨 **Wordle-Inspired Design** - Minimal, clean UI with familiar color palette
- 📊 **Statistics Dashboard** - Track your rating, reviews, and photo history
- 🔔 **Linear Integration** - Automatic issue creation for moderation alerts
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### Backend
- **Next.js API Routes** - Serverless API
- **MongoDB Atlas** - Database
- **NextAuth.js** - Authentication
- **Google Gemini 2.5 Flash** - AI moderation

### Infrastructure
- **Vercel** - Hosting and deployment
- **Vercel Blob Storage** - Image storage
- **Linear** - Issue tracking (optional)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Google Cloud Console account (for OAuth)
- GitHub account (for OAuth)
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/doublevision.git
cd doublevision
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
AUTH_GITHUB_ID=<your-github-client-id>
AUTH_GITHUB_SECRET=<your-github-client-secret>

# AI
GEMINI_API_KEY=<your-gemini-api-key>

# Storage
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>

# Linear (optional)
LINEAR_API_KEY=<your-linear-api-key>
LINEAR_TEAM_ID=<your-linear-team-id>
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
doublevision/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard page
│   ├── review/               # Review page
│   ├── feedback/             # Feedback page
│   ├── archive/              # Photo archive page
│   └── admin/                # Admin dashboard
├── components/               # React components
│   ├── Button.tsx           # Button with loading states
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── PhotoUpload.tsx      # Photo upload component
│   ├── RatingDisplay.tsx    # ELO rating display
│   ├── ReviewCard.tsx       # Review interface
│   ├── Skeleton.tsx         # Loading skeletons
│   └── Toast.tsx            # Toast notifications
├── lib/                      # Utility functions
│   ├── auth.ts              # NextAuth configuration
│   ├── db/                  # Database functions
│   ├── elo.ts               # ELO calculation
│   ├── gemini.ts            # AI moderation
│   ├── linear.ts            # Linear integration
│   ├── logger.ts            # Error logging
│   ├── rateLimit.ts         # Rate limiting
│   ├── validation.ts        # Input validation
│   └── imageOptimization.ts # Image utilities
├── DEPLOYMENT.md            # Deployment guide
├── PROGRESS.md              # Development progress
└── README.md                # This file
```

## Core Workflows

### 1. Photo Upload Flow

```
User logs in → Completes 5 reviews → Uploads photo → Photo enters queue
```

### 2. Review Flow

```
User gets 5 random assignments → Reviews each photo (1-5 stars + 50+ word comment)
→ AI moderates review → ELO rating updated → Review becomes visible to photo owner
```

### 3. Feedback Flow

```
User completes 5 reviews → Can view feedback on their photo
→ See average rating, individual reviews, and rating distribution
```

### 4. Moderation Flow

```
Review submitted → Gemini AI analyzes comment → Determines if offensive/spam/AI-generated
→ Auto-approves or rejects → High-confidence rejections create Linear issues
```

## ELO Rating System

- **Starting Rating**: 1000
- **K-Factor**: 32 (moderate volatility)
- **Quality Multipliers**:
  - 100+ words: 1.2x bonus
  - 75+ words: 1.1x bonus
- **Rating Tiers**:
  - 🌱 Beginner (0-899)
  - 📸 Intermediate (900-1199)
  - ⭐ Advanced (1200-1499)
  - 💎 Expert (1500-1799)
  - 👑 Master (1800+)

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | OAuth authentication |
| `/api/upload` | POST | Photo upload |
| `/api/reviews` | POST | Submit review |
| `/api/moderate` | POST | AI moderation |
| `/api/assignments` | GET/POST | Review assignments |
| `/api/user/stats` | GET | User statistics |

## Security Features

- **Rate Limiting**: 10 reviews per minute
- **Input Validation**: XSS prevention, spam detection
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Unique Indexes**: Prevent duplicate reviews
- **Sanitization**: All user input sanitized

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

- TypeScript for all code
- ESLint for linting
- Prettier for formatting (recommended)
- Conventional commits

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/doublevision)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by Wordle's simple and engaging design
- Built with [Next.js](https://nextjs.org)
- AI powered by [Google Gemini](https://ai.google.dev)
- Deployed on [Vercel](https://vercel.com)

## Support

For issues or questions:
- Check the [Deployment Guide](./DEPLOYMENT.md)
- Create an [issue](https://github.com/yourusername/doublevision/issues)
- Contact: your@email.com

---

**Made with ❤️ by [Your Name]**
