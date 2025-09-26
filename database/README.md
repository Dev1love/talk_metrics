# Database Setup

## Quick Start with Docker

1. Start PostgreSQL database:
```bash
cd database
docker-compose up -d
```

2. Database will be available at `localhost:5432` with:
- Database: `talk_metrics`
- User: `talk_metrics_user`
- Password: `talk_metrics_password`

## Database Schema Overview

### Core Tables

- **participants** - Chat participants (users and business accounts)
- **conversations** - Grouped chat conversations
- **messages** - Individual chat messages
- **ai_analysis** - AI processing results for messages
- **conversation_metrics** - Calculated metrics per conversation
- **global_metrics** - Aggregated daily metrics
- **insights** - Generated insights and recommendations
- **file_uploads** - Tracking of uploaded chat files

### Sample Data

The database includes demo data with:
- 4 participants (including business account)
- 3 conversations (booking, discount inquiry, complaint)
- 20+ messages across conversations
- AI analysis results
- Calculated metrics
- Generated insights

### Connection String

```
postgresql://talk_metrics_user:talk_metrics_password@localhost:5432/talk_metrics
```

## Manual Setup (Alternative)

If you prefer manual setup:

1. Create database and user:
```sql
CREATE DATABASE talk_metrics;
CREATE USER talk_metrics_user WITH ENCRYPTED PASSWORD 'talk_metrics_password';
GRANT ALL PRIVILEGES ON DATABASE talk_metrics TO talk_metrics_user;
```

2. Run schema:
```bash
psql -h localhost -U talk_metrics_user -d talk_metrics -f schema.sql
```

3. Load sample data:
```bash
psql -h localhost -U talk_metrics_user -d talk_metrics -f seed.sql
```