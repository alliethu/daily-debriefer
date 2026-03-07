-- Daily Debriefer — Supabase SQL Schema
-- Run this in the Supabase SQL editor to set up your database.

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  what_i_did    TEXT        NOT NULL DEFAULT '',
  impact        TEXT        NOT NULL DEFAULT '',
  is_quick_win  BOOLEAN     NOT NULL DEFAULT FALSE,
  energy_level  INTEGER     NOT NULL DEFAULT 3 CHECK (energy_level BETWEEN 1 AND 5),
  whats_unresolved   TEXT        NOT NULL DEFAULT '',
  attachment_summary TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─────────────────────────────────────────────
-- Migration: run this if the table already exists
-- ─────────────────────────────────────────────
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS attachment_summary TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS relationship_pulses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID        NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT        NOT NULL,
  sentiment   TEXT        NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'tense')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entry_themes (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID        NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entry_id, theme)
);

-- ─────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entries_updated_at ON entries;
CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

ALTER TABLE entries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_themes      ENABLE ROW LEVEL SECURITY;

-- entries
DROP POLICY IF EXISTS "entries_own" ON entries;
CREATE POLICY "entries_own" ON entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- relationship_pulses
DROP POLICY IF EXISTS "pulses_own" ON relationship_pulses;
CREATE POLICY "pulses_own" ON relationship_pulses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- entry_themes
DROP POLICY IF EXISTS "themes_own" ON entry_themes;
CREATE POLICY "themes_own" ON entry_themes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS entries_user_date   ON entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS pulses_entry_id     ON relationship_pulses(entry_id);
CREATE INDEX IF NOT EXISTS pulses_user_person  ON relationship_pulses(user_id, person_name);
CREATE INDEX IF NOT EXISTS themes_entry_id     ON entry_themes(entry_id);
CREATE INDEX IF NOT EXISTS themes_user_theme   ON entry_themes(user_id, theme);

-- ─────────────────────────────────────────────
-- saved_insights
-- ─────────────────────────────────────────────

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
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS insights_user_type ON saved_insights(user_id, type, created_at DESC);
