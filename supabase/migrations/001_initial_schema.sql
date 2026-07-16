-- ============================================================
-- UAPB Campus Research Map — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Buildings ────────────────────────────────────────────────
-- id matches the building_id property in public/buildings.geojson
CREATE TABLE buildings (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  code         TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  description  TEXT,
  image_url    TEXT,
  floors       INTEGER,
  year_built   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Research projects ─────────────────────────────────────────
CREATE TABLE research_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id      TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  abstract         TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'pending', 'on_hold')),
  funding_source   TEXT,
  grant_amount     NUMERIC(14, 2),
  grant_number     TEXT,
  start_date       DATE,
  end_date         DATE,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Researchers ───────────────────────────────────────────────
CREATE TABLE researchers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id      TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  title            TEXT,
  department       TEXT,
  email            TEXT,
  avatar_url       TEXT,
  specializations  TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Project ↔ Researcher join ─────────────────────────────────
CREATE TABLE project_researchers (
  project_id    UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  researcher_id UUID NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
  role          TEXT,
  PRIMARY KEY (project_id, researcher_id)
);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER research_projects_updated_at
  BEFORE UPDATE ON research_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER researchers_updated_at
  BEFORE UPDATE ON researchers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX ON research_projects (building_id);
CREATE INDEX ON research_projects (status);
CREATE INDEX ON researchers (building_id);
CREATE INDEX ON project_researchers (researcher_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE buildings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE researchers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_researchers ENABLE ROW LEVEL SECURITY;

-- Public read (anonymous visitors can see all data)
CREATE POLICY "public_read" ON buildings
  FOR SELECT USING (true);

CREATE POLICY "public_read" ON research_projects
  FOR SELECT USING (true);

CREATE POLICY "public_read" ON researchers
  FOR SELECT USING (true);

CREATE POLICY "public_read" ON project_researchers
  FOR SELECT USING (true);

-- Authenticated write (only logged-in users can insert / update / delete)
CREATE POLICY "auth_write" ON buildings
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_write" ON research_projects
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_write" ON researchers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_write" ON project_researchers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Seed: buildings from buildings.geojson ───────────────────
INSERT INTO buildings (id, name, code, lat, lng, description, floors, year_built) VALUES
  ('stem-building',        'STEM Building',                        'STEM', 34.2442, -92.0237, 'State-of-the-art facility supporting science, technology, engineering, and mathematics research across campus.', 4, 2016),
  ('woodward-hall',        'Woodward Hall',                        'WWH',  34.2440, -92.0221, 'Instructional facility for science and engineering programs.',                                                     3, NULL),
  ('holiday-hall',         'Holiday Hall',                         'HLD',  34.2435, -92.0221, 'Residential and administrative hall supporting student and faculty activities.',                                   3, NULL),
  ('walker-research-center','Walker Research Center',              'WRC',  34.2436, -92.0213, 'Dedicated research facility for applied sciences and engineering.',                                               2, NULL),
  ('caldwell-hall',        'Caldwell Hall',                        'CALD', 34.2422, -92.0196, 'Home to biology and agricultural sciences programs with active field and lab research.',                          3, 1958),
  ('la-davis-student-union','L.A. Davis Sr. Student Union',        'LDSU', 34.2429, -92.0226, 'Central campus hub connecting students, faculty, and community outreach programs.',                              2, 1985),
  ('henderson-young-hall', 'Henderson-Young Hall',                 'HYH',  34.2423, -92.0213, 'Academic and administrative building supporting multiple departments.',                                           3, NULL),
  ('caine-gilleland-hall', 'Caine-Gillelean Hall',                 'CGH',  34.2414, -92.0210, 'Academic hall housing classroom and laboratory spaces.',                                                          2, NULL),
  ('dawson-hicks-hall',    'Dawson-Hicks Hall',                    'DHH',  34.2413, -92.0202, 'Instructional building with classroom and office spaces.',                                                        2, NULL),
  ('corbin-hall',          'Corbin Hall',                          'CBH',  34.2407, -92.0209, 'Multi-purpose academic facility.',                                                                                2, NULL),
  ('rust-technology-building','Rust Technology Building',          'RTB',  34.2408, -92.0225, 'Home to engineering technology programs with lab and maker spaces.',                                              2, NULL),
  ('human-sciences-building','Human Sciences Building',            'HSB',  34.2440, -92.0200, 'Houses human sciences, nutrition, and social work programs.',                                                     2, NULL),
  ('john-b-watson-library','John B. Watson Library',               'JBWL', 34.2421, -92.0223, 'Main campus library providing research resources and study spaces.',                                              3, NULL),
  ('parker-1890-complex',  'S.J. Parker 1890 Extension Complex',   '1890', 34.2515, -92.0239, 'Extension complex supporting 1890 land-grant research and community outreach programs.',                         2, NULL),
  ('parker-ag-research',   'S.J. Parker Agriculture Research Bldg','PARB', 34.2526, -92.0242, 'Applied research in sustainable agriculture, soil science, and food systems.',                                   1, 2001);
