export interface BuildingMedia {
  hero: string;
  heroAlt: string;
  gallery: { src: string; alt: string }[];
  /** Optional equirectangular 360° image URL (future: dedicated photospheres). */
  panorama?: string;
}

function gallery(
  id: string,
  name: string,
  count: number
): { src: string; alt: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return {
      src: `/buildings/${id}/${id}-${num}.jpeg`,
      alt: `${name} — campus photo ${i + 1}`,
    };
  });
}

/** Static media paths for buildings with uploaded campus photos. */
export const BUILDING_MEDIA: Record<string, BuildingMedia> = {
  "stem-building": {
    hero: "/buildings/stem-building/stem-building-01.jpeg",
    heroAlt: "UAPB STEM Building exterior",
    gallery: gallery("stem-building", "STEM Building", 3),
  },
  "woodward-hall": {
    hero: "/buildings/woodward-hall/woodward-hall-01.jpeg",
    heroAlt: "Woodward Hall exterior at UAPB",
    gallery: gallery("woodward-hall", "Woodward Hall", 11),
  },
  "human-sciences-building": {
    hero: "/buildings/human-sciences-building/human-sciences-building-01.jpeg",
    heroAlt: "Human Sciences Building exterior at UAPB",
    gallery: gallery("human-sciences-building", "Human Sciences Building", 9),
  },
  "larrison-hall": {
    hero: "/buildings/larrison-hall/larrison-hall-01.jpeg",
    heroAlt: "Larrison Hall exterior at UAPB",
    gallery: gallery("larrison-hall", "Larrison Hall", 6),
  },
  "parker-1890-complex": {
    hero: "/buildings/parker-1890-complex/parker-1890-complex-01.jpeg",
    heroAlt: "S.J. Parker 1890 Extension Complex exterior",
    gallery: gallery("parker-1890-complex", "S.J. Parker 1890 Extension Complex", 10),
  },
  "parker-ag-research": {
    hero: "/buildings/parker-ag-research/parker-ag-research-01.jpeg",
    heroAlt: "S.J. Parker Agriculture Research Building exterior",
    gallery: gallery("parker-ag-research", "S.J. Parker Agriculture Research Bldg", 17),
  },
};

export function getBuildingMedia(buildingId: string): BuildingMedia | null {
  return BUILDING_MEDIA[buildingId] ?? null;
}

export function getBuildingHeroUrl(buildingId: string): string | null {
  return BUILDING_MEDIA[buildingId]?.hero ?? null;
}

export function enrichBuilding<T extends { id: string; image_url: string | null }>(
  building: T
): T {
  const hero = getBuildingHeroUrl(building.id);
  if (!hero || building.image_url) return building;
  return { ...building, image_url: hero };
}

export function enrichBuildings<T extends { id: string; image_url: string | null }>(
  buildings: T[]
): T[] {
  return buildings.map(enrichBuilding);
}

/** Buildings with campus photos first, then alphabetical. */
export function sortBuildingsWithPhotosFirst<
  T extends { id: string; name: string; image_url: string | null },
>(buildings: T[]): T[] {
  return [...buildings].sort((a, b) => {
    const aHasPhoto = Boolean(a.image_url ?? getBuildingHeroUrl(a.id));
    const bHasPhoto = Boolean(b.image_url ?? getBuildingHeroUrl(b.id));
    if (aHasPhoto !== bHasPhoto) return aHasPhoto ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
