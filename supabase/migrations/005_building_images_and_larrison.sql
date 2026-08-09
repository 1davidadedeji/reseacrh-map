-- Add Larrison Hall and set image_url for buildings with campus photos

INSERT INTO buildings (id, name, code, lat, lng, description, floors, year_built, image_url)
VALUES (
  'larrison-hall',
  'Larrison Hall',
  'LRH',
  34.2435,
  -92.0224,
  'Academic building on the main campus.',
  2,
  NULL,
  '/buildings/larrison-hall/larrison-hall-01.jpeg'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  image_url = EXCLUDED.image_url;

UPDATE buildings SET image_url = '/buildings/stem-building/stem-building-01.jpeg'
  WHERE id = 'stem-building' AND image_url IS NULL;

UPDATE buildings SET image_url = '/buildings/woodward-hall/woodward-hall-01.jpeg'
  WHERE id = 'woodward-hall' AND image_url IS NULL;

UPDATE buildings SET image_url = '/buildings/human-sciences-building/human-sciences-building-01.jpeg'
  WHERE id = 'human-sciences-building' AND image_url IS NULL;

UPDATE buildings SET image_url = '/buildings/parker-1890-complex/parker-1890-complex-01.jpeg'
  WHERE id = 'parker-1890-complex' AND image_url IS NULL;

UPDATE buildings SET image_url = '/buildings/parker-ag-research/parker-ag-research-01.jpeg'
  WHERE id = 'parker-ag-research' AND image_url IS NULL;
