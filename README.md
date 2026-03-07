# Daily Debriefer

A private leadership journal for managers and ICs who want to stay sharp, reflect consistently, and build a record of their impact over time.

Built with Next.js, Supabase, and the Anthropic API.

---

## What it does

Daily Debriefer gives you a structured daily journal with AI-powered synthesis. Each entry captures what you did, what the impact was, how you're feeling, and what's still unresolved. Over time, the app surfaces patterns, tensions, and wins you might otherwise lose track of.

---

## Features

### Journal entries
- **Daily debrief form** — structured fields for what you did, impact, energy level, unresolved items, themes, and people
- **Energy level** — a 1–5 slider (Drained → Energised) tracked per entry
- **Themes** — tag entries with leadership themes: Managing up, Team coaching, Delivery, Strategy, Hiring, Culture, Stakeholder alignment, Cross-functional, Systems work, External visibility
- **Relationship pulse** — track sentiment (positive / neutral / tense) for people you interacted with
- **File attachments** — upload a PDF, image, Word doc, or text file and Claude will stream a summary inline; the summary is saved with the entry and informs future AI insights

### Dashboard
- Chronological list of all entries with date, theme tags, energy emoji, and relationship pulse indicators
- Click any entry to edit it

### AI Insights
- **End-of-week synthesis** — wins, patterns, tensions, and one thing to carry forward; supports saving to revisit past weeks
- **Prep my 1:1** — pull entries mentioning a specific person and generate talking points
- **Quarterly reflection** — turn the last 90 days into a structured leadership narrative; supports saving
- Saved syntheses are stored per-user and shown in a collapsible list below each generator

### Auth
- Email/password sign-up and login via Supabase Auth
- All data is private and row-level secured per user

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database & Auth | Supabase (Postgres + RLS) |
| AI | Anthropic API (Claude) — streaming |
| File parsing | Mammoth (DOCX), Claude vision (images), Claude document API (PDF) |
| Styling | Tailwind CSS + CSS custom properties (Notion-inspired light theme) |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-debriefer
npm install
```

### 2. Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Database

Run `schema.sql` in the Supabase SQL editor. This creates all tables, RLS policies, and indexes.

If upgrading an existing database, run these migrations:

```sql
-- Add file attachment support
ALTER TABLE entries ADD COLUMN IF NOT EXISTS attachment_summary TEXT NOT NULL DEFAULT '';

-- Add saved AI insights
CREATE TABLE IF NOT EXISTS saved_insights (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  label      TEXT        NOT NULL DEFAULT '',
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insights_own" ON saved_insights;
CREATE POLICY "insights_own" ON saved_insights
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS insights_user_type ON saved_insights(user_id, type, created_at DESC);
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
