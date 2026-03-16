# CryptoCompare AI — Blog Generator

Lightweight standalone service for AI-powered blog generation. Part of the CryptoCompare AI two-project hybrid architecture.

## Overview

This service handles all blog content generation:

- Fetches trending crypto topics from NewsAPI
- Generates 1500–2000 word articles using Claude (Anthropic)
- Inserts internal links to exchange pages
- Optionally generates featured images via HuggingFace Stable Diffusion
- Saves blog posts to the shared PostgreSQL database

## Setup

```bash
cd blog-generator
npm install
cp .env.example .env
# Edit .env with your credentials
```

## Usage

### HTTP Server (for manual triggers from the admin panel)

```bash
npm run build && npm start
# or for development:
npm run dev
```

Endpoints:

| Method | Path           | Description                  |
| ------ | -------------- | ---------------------------- |
| GET    | `/health`      | Health check                 |
| POST   | `/api/trigger` | Trigger blog generation      |
| GET    | `/api/posts`   | List generated blog posts    |
| GET    | `/api/runs`    | List automation run history  |

### CLI (for Hetzner cron jobs)

```bash
npm run build
npm run generate -- --topics=3
# or publish immediately:
npm run generate -- --topics=5 --publish
```

### Cron Setup (Hetzner)

```cron
# Generate 3 blog posts daily at 6:00 AM UTC
0 6 * * * cd /path/to/blog-generator && node dist/cli.js --topics=3
```

## Architecture

- **No Prisma** — uses `pg` directly for minimal bundle size
- **No BullMQ/ioredis** — cron replaces the job queue
- **Shares the same PostgreSQL database** as the main CryptoCompare AI site
- Designed to run on Hetzner server alongside the main site's backend services

## Environment Variables

| Variable             | Required | Description                          |
| -------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string         |
| `ANTHROPIC_API_KEY`  | Yes      | Claude API key for article generation|
| `NEWSAPI_KEY`        | No       | NewsAPI key (uses fallback topics)   |
| `HUGGINGFACE_API_KEY`| No       | HuggingFace key for image generation |
| `PORT`               | No       | Server port (default: 4100)          |
| `API_SECRET`         | No       | Bearer token for authenticated routes|
