# TalkMetrics Backend API

Node.js/Express.js API server for TalkMetrics chat analysis system.

## Quick Start

1. Install dependencies:
```bash
cd backend
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

Server will run on http://localhost:3001

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DB_*` - Database connection settings
- `OPENAI_API_KEY` - OpenAI API key for AI analysis
- `WHATSAPP_API_TOKEN` - WhatsApp API token

## API Endpoints

### Health Check
- `GET /health` - Server health status

### File Upload
- `POST /api/v1/upload` - Upload chat files

### Conversations
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation details

### Metrics
- `GET /api/v1/metrics` - Get calculated metrics
- `GET /api/v1/metrics/global` - Get global metrics

### Insights
- `GET /api/v1/insights` - Get generated insights

### Reports
- `GET /api/v1/reports/pdf` - Generate PDF report
- `GET /api/v1/reports/csv` - Generate CSV export

## Scripts

- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm test` - Run tests
- `npm run lint` - ESLint check
- `npm run lint:fix` - Fix ESLint errors

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Database models
├── services/        # Business logic
├── routes/          # API routes
├── utils/           # Utility functions
└── server.js        # Main server file
```