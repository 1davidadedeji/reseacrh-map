import { CAMPUS_BUILDINGS } from "@/lib/campus-data";
import { RESEARCHERS } from "@/lib/researcher-data";

function parseGrantDollars(amount: string): number {
  return parseInt(amount.replace(/[$,]/g, ""), 10) || 0;
}

function findBuildingsWithGrant(term: string) {
  const q = term.toLowerCase();
  return CAMPUS_BUILDINGS.filter((b) =>
    b.grants.some(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        q.split(/\s+/).some((word) => word.length > 2 && g.title.toLowerCase().includes(word))
    )
  );
}

function findResearcher(query: string) {
  const q = query.toLowerCase();
  return RESEARCHERS.find((r) => r.name.toLowerCase().includes(q));
}

export function getLocalAssistantReply(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  if (/nsf|hbcu-up|epiic/.test(msg)) {
    const buildings = findBuildingsWithGrant("nsf");
    const people = RESEARCHERS.filter((r) =>
      r.knownGrants.some((g) => g.toLowerCase().includes("nsf"))
    );
    const lines = buildings.map(
      (b) =>
        `**${b.name}** (${b.code}): ${b.grants
          .filter((g) => /nsf|hbcu/i.test(g.title))
          .map((g) => `${g.title} — ${g.amount} (${g.status})`)
          .join("; ") || "see building grants"}`
    );
    const peopleLine =
      people.length > 0
        ? `\n\nNSF-linked researchers: ${people.map((p) => p.name).join(", ")}.`
        : "";
    return lines.length
      ? `These campus locations have **NSF-related grants**:\n\n${lines.join("\n")}${peopleLine}\n\nClick the matching marker on the map to explore.`
      : "I don't have NSF grant records tied to a specific building in the current dataset.";
  }

  if (/usda|agriculture/.test(msg)) {
    const buildings = CAMPUS_BUILDINGS.filter(
      (b) =>
        b.category === "Research" &&
        (b.id === "ag-research" || b.grants.some((g) => /usda|agriculture/i.test(g.title)))
    );
    const people = RESEARCHERS.filter((r) =>
      r.knownGrants.some((g) => g.toLowerCase().includes("usda"))
    );
    return `**USDA / agriculture research** on campus:\n\n${buildings
      .map((b) => `**${b.name}** — ${b.grants.map((g) => g.title).join(", ") || b.description}`)
      .join("\n")}\n\nResearchers: ${people.map((p) => `${p.name} (${p.department})`).join(", ") || "see Agriculture Research Center"}.`;
  }

  if (/biggest|largest|most funding|highest grant/.test(msg)) {
    let best = { building: CAMPUS_BUILDINGS[0], grant: CAMPUS_BUILDINGS[0].grants[0], amount: 0 };
    for (const b of CAMPUS_BUILDINGS) {
      for (const g of b.grants) {
        const amount = parseGrantDollars(g.amount);
        if (amount > best.amount) best = { building: b, grant: g, amount };
      }
    }
    if (!best.grant) return "No grant amounts are listed in the current campus dataset.";
    return `The largest listed grant is **${best.grant.title}** at **${best.grant.amount}** (${best.grant.status}), housed at **${best.building.name}** (${best.building.code}). Click that building on the map for full details.`;
  }

  if (/stem academy|stem/.test(msg)) {
    const b = CAMPUS_BUILDINGS.find((x) => x.id === "stem-academy");
    if (!b) return "STEM Academy is not in the current dataset.";
    return `**${b.name}** (${b.code}) is a **${b.category}** building.\n\n${b.description}\n\nGrants: ${b.grants.map((g) => `${g.title} (${g.amount}, ${g.status})`).join("; ")}\n\nResearchers: ${b.researchers.map((r) => `${r.name} — ${r.specialty}`).join("; ")}.`;
  }

  if (/david fernandez|fernandez/.test(msg)) {
    const r = findResearcher("David Fernandez");
    if (!r) return "I don't have David Fernandez in the researcher roster.";
    return `**${r.name}** — ${r.title || "Faculty"} in ${r.department}.\n\nKnown grants: ${r.knownGrants.join(", ") || "undisclosed in dataset"}. He is linked to **NSF EPIIC** and **USDA** programs on campus.`;
  }

  if (/who works|researcher|faculty|professor/.test(msg)) {
    const withGrants = RESEARCHERS.filter((r) => r.knownGrants.length > 0);
    return `Grant-funded researchers in the dataset:\n\n${withGrants
      .map((r) => `• **${r.name}** — ${r.department}; grants: ${r.knownGrants.join(", ")}`)
      .join("\n")}\n\nAsk about a specific person or grant program for more detail.`;
  }

  if (/building|campus|map|where/.test(msg)) {
    return `UAPB campus locations on the map:\n\n${CAMPUS_BUILDINGS.map(
      (b) => `• **${b.name}** (${b.code}) — ${b.category}${b.grants.length ? `, ${b.grants.length} grant(s)` : ""}`
    ).join("\n")}\n\nSelect a building in the left panel or click a marker to see grants and researchers.`;
  }

  if (/grant/.test(msg)) {
    const withGrants = CAMPUS_BUILDINGS.filter((b) => b.grants.length > 0);
    return `Active and pending grants by building:\n\n${withGrants
      .map(
        (b) =>
          `**${b.name}:** ${b.grants.map((g) => `${g.title} (${g.amount}, ${g.status})`).join("; ")}`
      )
      .join("\n")}`;
  }

  if (/hello|hi|hey|help/.test(msg)) {
    return "Hi! I'm **UAPB Atlas**. I can help with buildings, grants, and researchers on campus. Try asking which buildings have NSF grants, who works on USDA research, or about the STEM Academy.";
  }

  return `I can help with UAPB campus research questions using the map dataset. Try:\n• "Which buildings have NSF grants?"\n• "Who works on USDA research?"\n• "What is the biggest grant on campus?"\n• "Tell me about the STEM Academy"\n\nFor full AI answers, ensure a valid **OPENAI_API_KEY** is set in \`.env.local\`.`;
}
