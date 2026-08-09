-- Dr. Marian Evans and Dr. Jai Starling — UAPB research leadership profiles
-- Safe to re-run: fixed UUIDs and ON CONFLICT.

INSERT INTO researchers (
  id, building_id, name, title, department, email, specializations,
  bio, photo_url, awards, publications, website_url, google_scholar_url
) VALUES (
  'f6666666-6666-4666-8666-666666666666',
  'walker-research-center',
  'Dr. Marian Evans',
  'Program Coordinator, MISRGO / Interim Director, MRC',
  'Division of Research, Innovation & Economic Development',
  'evansm@uapb.edu',
  ARRAY['Public Health', 'Tobacco Prevention', 'Community Program Evaluation'],
  'Dr. Marian S. Evans coordinates the Minority Initiative Sub-Recipient Grant Office and serves as interim director of the Minority Research Center on Tobacco and Addictions at UAPB. With more than 25 years in community-based program planning, policy development, and grant evaluation, she leads statewide efforts to reduce tobacco-related health disparities in minority and rural communities.',
  '/researchers/marian-evans.png',
  ARRAY['Quantum Leap Leadership Development Program Cohort VI (2025)', 'Certified Tobacco Treatment Specialist — MD Anderson'],
  '[]'::jsonb,
  'https://armrc.org',
  null
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  specializations = EXCLUDED.specializations,
  bio = EXCLUDED.bio,
  photo_url = EXCLUDED.photo_url,
  awards = EXCLUDED.awards,
  publications = EXCLUDED.publications,
  website_url = EXCLUDED.website_url,
  google_scholar_url = EXCLUDED.google_scholar_url,
  updated_at = NOW();

INSERT INTO researchers (
  id, building_id, name, title, department, email, specializations,
  bio, photo_url, awards, publications, website_url, google_scholar_url
) VALUES (
  'f7777777-7777-4777-8777-777777777777',
  'walker-research-center',
  'Dr. Jai Starling',
  'Director of Research and Sponsored Programs',
  'Division of Research, Innovation & Economic Development',
  'starlingj@uapb.edu',
  ARRAY['Grant Administration', 'Federal Compliance', 'Research Infrastructure'],
  'Jacquese "Jai" Starling directs UAPB''s Office of Research and Sponsored Programs, overseeing the full grant lifecycle from pre-award through post-award compliance. A U.S. Navy veteran with an MBA and Master of Data Science, she brings deep expertise in 2 CFR 200 federal compliance, audit readiness, and building sustainable research administration systems.',
  '/researchers/jai-starling.png',
  ARRAY[]::text[],
  '[]'::jsonb,
  'https://uapb.edu/administration/research-innovation-and-economic-development/',
  null
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  specializations = EXCLUDED.specializations,
  bio = EXCLUDED.bio,
  photo_url = EXCLUDED.photo_url,
  awards = EXCLUDED.awards,
  publications = EXCLUDED.publications,
  website_url = EXCLUDED.website_url,
  google_scholar_url = EXCLUDED.google_scholar_url,
  updated_at = NOW();
