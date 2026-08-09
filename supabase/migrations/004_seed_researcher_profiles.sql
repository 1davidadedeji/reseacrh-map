-- Flesh out Dr. Webb's profile + seed a few more placeholder researchers
-- across already-seeded buildings so the People Directory isn't sparse.
-- Safe to re-run: fixed UUIDs and ON CONFLICT.

UPDATE researchers SET
  bio = 'Dr. Webb studies computational approaches to condensed-matter physics and leads UAPB''s NSF-funded STEM education initiative, mentoring undergraduate researchers in scientific computing.',
  photo_url = null,
  awards = ARRAY['UAPB Faculty Excellence in Research Award (2023)', 'NSF Early Career Mentor Recognition (2021)'],
  publications = '[
    {"title": "Computational Models of Disordered Lattice Systems", "year": 2023, "url": "https://doi.org/10.1000/example-webb-2023"},
    {"title": "Bridging Undergraduate Research and STEM Retention at HBCUs", "year": 2022}
  ]'::jsonb,
  website_url = 'https://www.uapb.edu/academics/physics/webb',
  google_scholar_url = 'https://scholar.google.com/citations?user=example-webb'
WHERE id = 'a1111111-1111-4111-8111-111111111111';

INSERT INTO researchers (
  id, building_id, name, title, department, email, specializations,
  bio, awards, publications, website_url, google_scholar_url
) VALUES (
  'c3333333-3333-4333-8333-333333333333',
  'caldwell-hall',
  'Dr. Amara Johnson',
  'Associate Professor',
  'Biology',
  'ajohnson@uapb.edu',
  ARRAY['Molecular Genetics', 'Plant Pathology'],
  'Dr. Johnson''s lab investigates gene expression in stress-tolerant crop varieties, with NIH-funded infrastructure supporting undergraduate genomics training.',
  ARRAY['NIH Research Infrastructure Investigator Award (2022)'],
  '[{"title": "Stress-Responsive Gene Networks in Arkansas Row Crops", "year": 2022}]'::jsonb,
  'https://www.uapb.edu/academics/biology/johnson',
  'https://scholar.google.com/citations?user=example-johnson'
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  specializations = EXCLUDED.specializations,
  bio = EXCLUDED.bio,
  awards = EXCLUDED.awards,
  publications = EXCLUDED.publications,
  website_url = EXCLUDED.website_url,
  google_scholar_url = EXCLUDED.google_scholar_url,
  updated_at = NOW();

INSERT INTO researchers (
  id, building_id, name, title, department, email, specializations,
  bio, awards, publications, website_url, google_scholar_url
) VALUES (
  'd4444444-4444-4444-8444-444444444444',
  'parker-ag-research',
  'Dr. Raymond Tate',
  'Professor',
  'Agriculture',
  'rtate@uapb.edu',
  ARRAY['Soil Science', 'Sustainable Agriculture'],
  'Dr. Tate leads USDA-funded field trials on soil health and sustainable row-crop systems across Arkansas, partnering with regional growers on applied research.',
  ARRAY['USDA Sustainable Agriculture Research Fellow (2020)'],
  '[{"title": "Soil Carbon Dynamics in Delta Row-Crop Rotations", "year": 2021, "url": "https://doi.org/10.1000/example-tate-2021"}]'::jsonb,
  null,
  'https://scholar.google.com/citations?user=example-tate'
)
ON CONFLICT (id) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  specializations = EXCLUDED.specializations,
  bio = EXCLUDED.bio,
  awards = EXCLUDED.awards,
  publications = EXCLUDED.publications,
  website_url = EXCLUDED.website_url,
  google_scholar_url = EXCLUDED.google_scholar_url,
  updated_at = NOW();

INSERT INTO researchers (
  id, building_id, name, title, department, email, specializations,
  bio, awards, publications, website_url, google_scholar_url
) VALUES (
  'e5555555-5555-4555-8555-555555555555',
  'walker-research-center',
  'Dr. Priya Nair',
  'Assistant Professor',
  'Engineering',
  'pnair@uapb.edu',
  ARRAY['Robotics', 'Applied Machine Learning'],
  'Dr. Nair directs the Applied Robotics Lab at the Walker Research Center, developing low-cost sensing platforms for agricultural and environmental monitoring.',
  ARRAY['UAPB Early Career Innovation Award (2024)'],
  '[{"title": "Low-Cost Multispectral Sensing for Precision Agriculture", "year": 2024}]'::jsonb,
  'https://www.uapb.edu/academics/engineering/nair',
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
  awards = EXCLUDED.awards,
  publications = EXCLUDED.publications,
  website_url = EXCLUDED.website_url,
  google_scholar_url = EXCLUDED.google_scholar_url,
  updated_at = NOW();
