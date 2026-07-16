export interface Researcher {
  name: string;
  department: string;
  title: string;
  isGrantFunded: boolean;
  knownGrants: string[];
}

export const RESEARCHERS: Researcher[] = [
  {
    name: "George R. Cotton, Sr.",
    department: "Institutional Advancement",
    title: "Vice Chancellor",
    isGrantFunded: true,
    knownGrants: [],
  },
  {
    name: "Libra Roulhac",
    department: "Institutional Advancement: Development & Relations",
    title: "",
    isGrantFunded: true,
    knownGrants: [],
  },
  {
    name: "Jaimie Wright",
    department: "Institutional Advancement: Development & Relations",
    title: "",
    isGrantFunded: true,
    knownGrants: [],
  },
  {
    name: "David Fernandez",
    department: "Graduate Studies and Continuing Education",
    title: "Interim Dean / Extension Livestock Specialist",
    isGrantFunded: true,
    knownGrants: ["NSF EPIIC", "USDA"],
  },
  {
    name: "Emad Omar Badradeen",
    department: "Unknown",
    title: "",
    isGrantFunded: true,
    knownGrants: ["NSF EPIIC"],
  },
  {
    name: "Henry English",
    department: "Unknown",
    title: "",
    isGrantFunded: true,
    knownGrants: ["USDA"],
  },
  {
    name: "Rita Conley",
    department: "Student Success Center",
    title: "Director",
    isGrantFunded: true,
    knownGrants: [],
  },
  {
    name: "Pamela D. Moore",
    department: "OIPS",
    title: "",
    isGrantFunded: true,
    knownGrants: [],
  },
];

// Map grant programs to the researchers that share them (for arc visualization)
export interface GrantCollaboration {
  grant: string;
  members: Researcher[];
}

export function getGrantCollaborations(): GrantCollaboration[] {
  const grantMap = new Map<string, Researcher[]>();
  for (const researcher of RESEARCHERS) {
    for (const grant of researcher.knownGrants) {
      const existing = grantMap.get(grant) ?? [];
      grantMap.set(grant, [...existing, researcher]);
    }
  }
  return Array.from(grantMap.entries())
    .filter(([, members]) => members.length > 1)
    .map(([grant, members]) => ({ grant, members }));
}

// Derive initials for avatar display
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getGrantBadgeColor(grant: string): string {
  const map: Record<string, string> = {
    "NSF EPIIC": "#6366f1",
    USDA: "#16a34a",
    NIH: "#0ea5e9",
    DOE: "#f97316",
    "NSF HBCU-UP": "#8b5cf6",
  };
  return map[grant] ?? "#9ca3af";
}
