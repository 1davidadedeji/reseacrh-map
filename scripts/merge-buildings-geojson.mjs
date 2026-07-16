/**
 * Merge public/export.geojson (sharp OSM polygons) with public/buildings.geojson
 * (research app metadata). Export is the base; buildings-only entries are appended.
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildingsPath = join(root, "public/buildings.geojson");
const exportPath = join(root, "public/export.geojson");

const buildings = JSON.parse(readFileSync(buildingsPath, "utf8"));
const exported = JSON.parse(readFileSync(exportPath, "utf8"));

/** Normalize names for fuzzy matching */
function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extra aliases where OSM name differs from campus data */
const NAME_TO_BUILDING_ID = {
  "l a davis sr student union": "la-davis-student-union",
  "l a david sr student union": "la-davis-student-union",
};

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveBuildingId(exportName, buildingsByNormName) {
  const norm = normalizeName(exportName);
  if (NAME_TO_BUILDING_ID[norm]) return NAME_TO_BUILDING_ID[norm];

  const direct = buildingsByNormName.get(norm);
  if (direct) return direct.properties.building_id;

  for (const feature of buildings.features) {
    const bn = normalizeName(feature.properties.name);
    if (bn === norm) return feature.properties.building_id;
    if (bn.replace("david", "davis") === norm.replace("david", "davis")) {
      return feature.properties.building_id;
    }
  }
  return null;
}

function appProperties(exportProps, buildingFeature) {
  if (buildingFeature) {
    const p = buildingFeature.properties;
    return {
      building_id: p.building_id,
      name: p.name,
      code: p.code,
      map_number: p.map_number ?? null,
      osm_id: exportProps["@id"] ?? null,
    };
  }

  const name = exportProps.name ?? "Building";
  return {
    building_id: slugify(name) || String(exportProps["@id"] ?? "building").replace(/\//g, "-"),
    name,
    code: "",
    map_number: null,
    osm_id: exportProps["@id"] ?? null,
  };
}

const buildingsById = new Map(
  buildings.features.map((f) => [f.properties.building_id, f])
);
const buildingsByNormName = new Map(
  buildings.features.map((f) => [normalizeName(f.properties.name), f])
);

const matchedBuildingIds = new Set();
const mergedFeatures = [];

for (const feature of exported.features) {
  if (feature.geometry?.type !== "Polygon" && feature.geometry?.type !== "MultiPolygon") {
    continue;
  }

  const exportName = feature.properties?.name;
  const buildingId = exportName ? resolveBuildingId(exportName, buildingsByNormName) : null;
  const buildingFeature = buildingId ? buildingsById.get(buildingId) : null;

  if (buildingId) matchedBuildingIds.add(buildingId);

  mergedFeatures.push({
    type: "Feature",
    properties: appProperties(feature.properties ?? {}, buildingFeature),
    geometry: feature.geometry,
  });
}

for (const feature of buildings.features) {
  const id = feature.properties.building_id;
  if (matchedBuildingIds.has(id)) continue;

  mergedFeatures.push({
    type: "Feature",
    properties: {
      building_id: id,
      name: feature.properties.name,
      code: feature.properties.code,
      map_number: feature.properties.map_number ?? null,
      osm_id: null,
    },
    geometry: feature.geometry,
  });
}

const merged = {
  type: "FeatureCollection",
  metadata: {
    merged_at: new Date().toISOString(),
    sources: ["public/export.geojson", "public/buildings.geojson"],
    export_features: exported.features.length,
    buildings_catalog: buildings.features.length,
    total_features: mergedFeatures.length,
  },
  features: mergedFeatures,
};

writeFileSync(buildingsPath, `${JSON.stringify(merged, null, 2)}\n`);
unlinkSync(exportPath);

console.log(`Merged ${mergedFeatures.length} features → public/buildings.geojson`);
console.log(`  From export (OSM geometry): ${exported.features.length}`);
console.log(`  Matched to research catalog: ${matchedBuildingIds.size}`);
console.log(
  `  Appended from buildings.geojson only: ${buildings.features.length - matchedBuildingIds.size}`
);
console.log("Removed public/export.geojson");
