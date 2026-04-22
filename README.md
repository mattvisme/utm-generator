# Visme UTM Generator

Internal tool for generating standardized UTM-tagged URLs across all Visme teams.

## Setup

1. Clone this repo
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in values
4. `npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| AUTH_PASSWORD | Shared password to access the tool |
| JWT_SECRET | Random string for signing session tokens (min 32 chars) |
| ANTHROPIC_API_KEY | Claude API key from console.anthropic.com |
| NOTION_API_KEY | Notion integration secret |
| NOTION_DATABASE_ID | ID of the UTM Links Notion database |
| SLACK_WEBHOOK_URL | Incoming webhook URL for #marketing-analytics |

## Notion Database Setup

Create a Notion database named **"UTM Links — Visme"** with these properties:

| Property | Type |
|---|---|
| Name | Title |
| URL (Original) | URL |
| URL (With UTMs) | URL |
| Description | Text |
| Channel | Select |
| utm_source | Text |
| utm_medium | Text |
| utm_campaign | Text |
| utm_content | Text |
| utm_term | Text |
| vc_parameter | Text |
| GA4 Setup Required | Checkbox |
| GA4 Setup Notes | Text |
| Created | Date |
| Created By | Text |

Then share the database with your Notion integration and copy the database ID from the URL.

## Deployment

Push to `main` branch → auto-deploys to Vercel.
All env vars must be set in Vercel project settings.

## Adding new UTM values

New `utm_source` or `utm_medium` values must be approved by Marketing Ops before being added to the Claude system prompt in `/lib/claude.ts`.
