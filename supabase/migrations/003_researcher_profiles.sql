-- ============================================================
-- Researcher profile fields — powers the People Directory page
-- ============================================================

ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS bio                TEXT,
  ADD COLUMN IF NOT EXISTS photo_url          TEXT,
  ADD COLUMN IF NOT EXISTS awards             TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS publications       JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS website_url        TEXT,
  ADD COLUMN IF NOT EXISTS google_scholar_url TEXT;

-- publications shape: [{ "title": string, "year"?: number, "url"?: string }, ...]
