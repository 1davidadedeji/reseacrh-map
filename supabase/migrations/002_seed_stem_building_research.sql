-- Seed one research project + one researcher for stem-building (end-to-end sidebar test)
-- Safe to re-run: uses fixed UUIDs and ON CONFLICT.

INSERT INTO researchers (
  id,
  building_id,
  name,
  title,
  department,
  email,
  specializations
) VALUES (
  'a1111111-1111-4111-8111-111111111111',
  'stem-building',
  'Dr. Marcus Webb',
  'Associate Professor',
  'Physics',
  'mwebb@uapb.edu',
  ARRAY['Computational Modeling', 'STEM Education']
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  specializations = EXCLUDED.specializations,
  updated_at = NOW();

INSERT INTO research_projects (
  id,
  building_id,
  title,
  abstract,
  status,
  funding_source,
  grant_amount,
  grant_number,
  tags
) VALUES (
  'b2222222-2222-4222-8222-222222222222',
  'stem-building',
  'NSF HBCU-UP STEM Initiative',
  'Supports undergraduate research pathways and STEM faculty development at UAPB.',
  'active',
  'National Science Foundation',
  450000.00,
  'NSF-HBCU-UP-2024',
  ARRAY['STEM', 'NSF', 'Undergraduate Research']
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  title = EXCLUDED.title,
  abstract = EXCLUDED.abstract,
  status = EXCLUDED.status,
  funding_source = EXCLUDED.funding_source,
  grant_amount = EXCLUDED.grant_amount,
  grant_number = EXCLUDED.grant_number,
  tags = EXCLUDED.tags,
  updated_at = NOW();

INSERT INTO project_researchers (project_id, researcher_id, role)
VALUES (
  'b2222222-2222-4222-8222-222222222222',
  'a1111111-1111-4111-8111-111111111111',
  'Principal Investigator'
)
ON CONFLICT (project_id, researcher_id) DO UPDATE SET
  role = EXCLUDED.role;
