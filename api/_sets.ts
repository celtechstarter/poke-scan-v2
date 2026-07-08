// api/_sets.ts
// Einzige Quelle für Set-Daten. Wird von recognize.ts (Prompt) und prices.ts (Mapping) genutzt.
// Verifiziert gegen https://api.tcgdex.net/v2/en/sets am 2026-07-08.

export interface SetInfo {
  ptcgo: string;            // Set-Code unten links auf der Karte
  tcgdexId: string;         // TCGdex API Set-ID
  name: string;             // englischer Set-Name
  official: number | null;  // offizielle Kartenzahl (Zahl hinter dem "/"), null = Promo
}

export const SETS: SetInfo[] = [
  { ptcgo: 'SVI', tcgdexId: 'sv01',    name: 'Scarlet & Violet',        official: 198 },
  { ptcgo: 'PAL', tcgdexId: 'sv02',    name: 'Paldea Evolved',          official: 193 },
  { ptcgo: 'OBF', tcgdexId: 'sv03',    name: 'Obsidian Flames',         official: 197 },
  { ptcgo: 'MEW', tcgdexId: 'sv03.5',  name: '151',                     official: 165 },
  { ptcgo: 'PAR', tcgdexId: 'sv04',    name: 'Paradox Rift',            official: 182 },
  { ptcgo: 'PAF', tcgdexId: 'sv04.5',  name: 'Paldean Fates',           official: 91 },
  { ptcgo: 'TEF', tcgdexId: 'sv05',    name: 'Temporal Forces',         official: 162 },
  { ptcgo: 'TWM', tcgdexId: 'sv06',    name: 'Twilight Masquerade',     official: 167 },
  { ptcgo: 'SFA', tcgdexId: 'sv06.5',  name: 'Shrouded Fable',          official: 64 },
  { ptcgo: 'SCR', tcgdexId: 'sv07',    name: 'Stellar Crown',           official: 142 },
  { ptcgo: 'SSP', tcgdexId: 'sv08',    name: 'Surging Sparks',          official: 191 },
  { ptcgo: 'PRE', tcgdexId: 'sv08.5',  name: 'Prismatic Evolutions',    official: 131 },
  { ptcgo: 'JTG', tcgdexId: 'sv09',    name: 'Journey Together',        official: 159 },
  { ptcgo: 'DRI', tcgdexId: 'sv10',    name: 'Destined Rivals',         official: 182 },
  { ptcgo: 'BLK', tcgdexId: 'sv10.5b', name: 'Black Bolt',              official: 86 },
  { ptcgo: 'WHT', tcgdexId: 'sv10.5w', name: 'White Flare',             official: 86 },
  { ptcgo: 'MEG', tcgdexId: 'me01',    name: 'Mega Evolution',          official: 132 },
  { ptcgo: 'SVP', tcgdexId: 'svp',     name: 'Scarlet & Violet Promos', official: null },
  // TODO (Claude Code): Die ptcgo-Codes der neuesten Sets bitte selbst verifizieren, bevor du
  // sie ergänzt (Code steht unten links auf echten Karten). TCGdex-IDs existieren bereits für:
  // me02 (Phantasmal Flames), me02.5 (Ascended Heroes), me03 (Perfect Order), me04 (Chaos Rising).
];

export const PTCGO_TO_TCGDEX: Record<string, string> =
  Object.fromEntries(SETS.map((s) => [s.ptcgo, s.tcgdexId]));

export const VALID_SET_CODES: string[] = SETS.map((s) => s.ptcgo);

// Vintage-Sets (kein Set-Code auf der Karte, Erkennung über Copyright-Zeile/Symbol)
export const SETNAME_TO_TCGDEX: Record<string, string> = {
  'Base Set':      'base1',
  'Jungle':        'base2',
  'Fossil':        'base3',
  'Base Set 2':    'base4',
  'Team Rocket':   'base5',
  'Gym Heroes':    'gym1',
  'Gym Challenge': 'gym2',
  'Neo Genesis':   'neo1',
  'Neo Discovery': 'neo2',
  'Neo Revelation':'neo3',
  'Neo Destiny':   'neo4',
};

// Hilfsfunktionen: generieren die Tabellen für den KI-Prompt aus denselben Daten
export function promptSetTable(): string {
  return SETS.filter((s) => s.official !== null)
    .map((s) => `${s.ptcgo}=${s.name}`)
    .join(' | ');
}

export function promptTotalsTable(): string {
  return SETS.filter((s) => s.official !== null)
    .map((s) => `/${s.official}=${s.ptcgo}`)
    .join(' | ');
}
