// KU Parking MCP Server -- Supabase Edge Function (Deno runtime)
//
// Preserved as a historical reference alongside the active Cloud Run version
// at ../../../cloudrun/index.ts. Same server, same data, same MCP protocol;
// only the host platform and bootstrap differ.
//
// Deploy (if you ever want to redeploy the Supabase version):
//     cd infra/ku-parking-mcp
//     supabase functions deploy ku-parking --no-verify-jwt
//
// Public URL format:
//     https://<project-ref>.supabase.co/functions/v1/ku-parking
//
// Data source: parking.ku.edu (permit pages + 2024-25 parking map PDF),
// refreshed 2026-04-23. Most lot coordinates are approximate.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// -----------------------------------------------------------------------------
// Buildings
// -----------------------------------------------------------------------------

type Coords = [number, number];

const KU_BUILDINGS: Record<string, Coords> = {
  "Capitol Federal Hall (Business School)": [38.953505, -95.249740],
  "Kansas Union":                            [38.959200, -95.243500],
  "Allen Fieldhouse":                        [38.954306, -95.252394],
  "Strong Hall":                             [38.958542, -95.247614],
  "Watson Library":                          [38.956621, -95.244787],
  "Anschutz Library":                        [38.957323, -95.249742],
  "Dyche Hall":                              [38.958610, -95.243890],
  "Fraser Hall":                             [38.957160, -95.243590],
  "Lied Center":                             [38.954940, -95.262890],
  "Memorial Stadium":                        [38.963330, -95.246390],
  "Wescoe Hall":                             [38.957430, -95.247830],
  "Spencer Museum of Art":                   [38.959634, -95.244569],
  "Ambler Student Recreation Fitness Center":[38.952512, -95.247929],
};

const BUILDING_ALIASES: Record<string, string[]> = {
  "Capitol Federal Hall (Business School)": [
    "business school", "b-school", "bschool", "biz school",
    "school of business", "ku business school", "ku business",
    "capitol federal", "capitol federal hall", "capfed", "cap fed",
  ],
  "Kansas Union": [
    "union", "student union", "ku union", "the union", "ku student union",
    "memorial union", "bookstore",
  ],
  "Allen Fieldhouse": [
    "allen", "fieldhouse", "the phog", "phog", "phog allen",
    "basketball stadium", "phog stadium", "basketball arena",
    "ku basketball", "basketball", "jayhawk basketball",
  ],
  "Strong Hall": [
    "strong", "admin building", "administration", "admin",
    "chancellor", "chancellor's office",
  ],
  "Watson Library": [
    "watson", "watson lib", "main library", "research library",
    "ku library",
  ],
  "Anschutz Library": [
    "anschutz", "anschutz lib", "science library", "stem library",
  ],
  "Dyche Hall": [
    "dyche", "natural history museum", "nhm",
    "biodiversity institute", "museum of natural history",
  ],
  "Fraser Hall": [
    "fraser", "psychology building", "psych building",
  ],
  "Lied Center": [
    "lied", "performing arts", "performing arts center",
    "concert hall", "theater",
  ],
  "Memorial Stadium": [
    "stadium", "football stadium", "memorial", "kivisto field",
    "ku football", "football arena", "jayhawk football",
  ],
  "Wescoe Hall": [
    "wescoe", "wescoe beach", "liberal arts building",
    "college of liberal arts", "humanities building",
  ],
  "Spencer Museum of Art": [
    "spencer", "spencer museum", "art museum", "museum of art",
  ],
  "Ambler Student Recreation Fitness Center": [
    "ambler", "ambler gym", "ambler fitness", "ambler fitness center",
    "ambler rec", "ambler rec center", "ambler recreation",
    "ambler srfc", "srfc",
    "student gym", "student rec", "student rec center",
    "recreation center", "fitness center", "rec center",
    "campus gym", "campus rec", "ku gym", "the rec", "gym",
  ],
};

// -----------------------------------------------------------------------------
// Parking lots
// -----------------------------------------------------------------------------

interface ParkingLot {
  lot: string;
  colors: string[];
  lat: number;
  lng: number;
  near: string;
}

const KU_PARKING_LOTS: ParkingLot[] = [
  { lot: "Lot 1",   colors: ["Blue"],                lat: 38.9600, lng: -95.2490, near: "E. Carruth-O'Leary Hall" },
  { lot: "Lot 6",   colors: ["Blue"],                lat: 38.9566, lng: -95.2510, near: "S.W. Green Hall" },
  { lot: "Lot 7",   colors: ["Red"],                 lat: 38.9566, lng: -95.2530, near: "N.W. Green Hall" },
  { lot: "Lot 8",   colors: ["Blue"],                lat: 38.9566, lng: -95.2490, near: "Sunnyside Avenue" },
  { lot: "Lot 9",   colors: ["Red"],                 lat: 38.9566, lng: -95.2560, near: "N. Nunemaker Hall" },
  { lot: "Lot 10",  colors: ["Gold"],                lat: 38.956221, lng: -95.244787, near: "S. Watson Library" },
  { lot: "Lot 11",  colors: ["Blue"],                lat: 38.9633, lng: -95.2490, near: "N. Joseph R. Pearson Hall" },
  { lot: "Lot 12",  colors: ["Gold"],                lat: 38.9566, lng: -95.2440, near: "Lilac Lane" },
  { lot: "Lot 13",  colors: ["Gold"],                lat: 38.9585, lng: -95.2440, near: "E. Danforth Chapel" },
  { lot: "Lot 14",  colors: ["Gold"],                lat: 38.957160, lng: -95.243070, near: "E. Fraser Hall" },
  { lot: "Lot 15",  colors: ["Blue"],                lat: 38.9566, lng: -95.2440, near: "E. Blake Hall" },
  { lot: "Lot 16",  colors: ["Gold"],                lat: 38.959200, lng: -95.242980, near: "E. Kansas Union" },
  { lot: "Lot 17",  colors: ["Blue"],                lat: 38.9566, lng: -95.2490, near: "N. Summerfield Hall" },
  { lot: "Lot 18",  colors: ["Gold"],                lat: 38.957030, lng: -95.247830, near: "S. Wescoe Hall" },
  { lot: "Lot 19",  colors: ["Blue"],                lat: 38.9566, lng: -95.2470, near: "Sunflower Road" },
  { lot: "Lot 34",  colors: ["Blue", "Red"],         lat: 38.9566, lng: -95.2470, near: "Price Computing Center" },
  { lot: "Lot 35",  colors: ["Blue"],                lat: 38.9566, lng: -95.2490, near: "S. Military Science Building" },
  { lot: "Lot 36",  colors: ["Gold", "Blue", "Red"], lat: 38.9585, lng: -95.2470, near: "W. Memorial Drive" },
  { lot: "Lot 37",  colors: ["Blue"],                lat: 38.9566, lng: -95.2470, near: "N. Haworth Hall" },
  { lot: "Lot 38",  colors: ["Blue"],                lat: 38.9566, lng: -95.2440, near: "E. Hall Center" },
  { lot: "Lot 39",  colors: ["Gold", "Blue", "Red"], lat: 38.9585, lng: -95.2470, near: "E. Memorial Drive" },
  { lot: "Lot 41",  colors: ["Blue", "Red"],         lat: 38.9585, lng: -95.2530, near: "W. Learned Hall" },
  { lot: "Lot 52",  colors: ["Red"],                 lat: 38.9633, lng: -95.2490, near: "E. Carruth-O'Leary & JRP" },
  { lot: "Lot 54",  colors: ["Blue", "Red"],         lat: 38.9566, lng: -95.2510, near: "W. Murphy Hall" },
  { lot: "Lot 70",  colors: ["Red"],                 lat: 38.953906, lng: -95.252394, near: "S. Allen Fieldhouse" },
  { lot: "Lot 72",  colors: ["Red"],                 lat: 38.9566, lng: -95.2530, near: "E. Burge Union" },
  { lot: "Lot 91",  colors: ["Red", "Yellow"],       lat: 38.959634, lng: -95.244569, near: "Spencer Museum of Art" },
  { lot: "Lot 102", colors: ["Red"],                 lat: 38.9566, lng: -95.2560, near: "S. Lewis Hall" },
  { lot: "Lot 117", colors: ["Blue", "Red", "Yellow"], lat: 38.9540, lng: -95.2470, near: "E. Watkins Health Center" },
  { lot: "Lot 118", colors: ["Blue"],                lat: 38.953505, lng: -95.249740, near: "E. Capitol Federal Hall" },
  { lot: "Lot 126", colors: ["Blue"],                lat: 38.9566, lng: -95.2470, near: "Facilities Administration Bldg" },
  { lot: "Lot 129", colors: ["Blue"],                lat: 38.9585, lng: -95.2510, near: "E. Learned Hall" },

  { lot: "Lot 50",  colors: ["Yellow"],              lat: 38.9633, lng: -95.2490, near: "E. Carruth-O'Leary & JRP" },
  { lot: "Lot 51",  colors: ["Red", "Yellow"],       lat: 38.9660, lng: -95.2490, near: "Max Kade Center / Sudler Annex" },
  { lot: "Lot 53",  colors: ["Yellow"],              lat: 38.9600, lng: -95.2440, near: "Mississippi Street" },
  { lot: "Lot 56",  colors: ["Yellow"],              lat: 38.9633, lng: -95.2490, near: "W. Memorial Stadium" },
  { lot: "Lot 60",  colors: ["Red", "Yellow"],       lat: 38.963330, lng: -95.246910, near: "W. Memorial Stadium" },
  { lot: "Lot 61",  colors: ["Yellow"],              lat: 38.9566, lng: -95.2440, near: "Sunnyside & Illinois" },
  { lot: "Lot 62",  colors: ["Red", "Yellow"],       lat: 38.9566, lng: -95.2440, near: "Sunnyside & Illinois" },
  { lot: "Lot 71",  colors: ["Yellow"],              lat: 38.953666, lng: -95.252394, near: "S. Allen Fieldhouse" },
  { lot: "Lot 90",  colors: ["Blue", "Red", "Yellow"], lat: 38.952512, lng: -95.247929, near: "Rec Center (Ambler SRFC)" },
  { lot: "Lot 93",  colors: ["Blue", "Yellow"],      lat: 38.9540, lng: -95.2560, near: "N. Stouffer Place" },
  { lot: "Lot 125", colors: ["Yellow"],              lat: 38.9510, lng: -95.2530, near: "Hoglund Ballpark" },
  { lot: "Lot 127", colors: ["Yellow"],              lat: 38.9510, lng: -95.2530, near: "N. Downs Hall" },

  { lot: "Lot 96",  colors: ["Green"],               lat: 38.9660, lng: -95.2470, near: "GSP & Corbin Halls" },
  { lot: "Lot 101", colors: ["Red", "Green"],        lat: 38.9566, lng: -95.2560, near: "E. Templin Hall (Daisy Hill)" },
  { lot: "Lot 103", colors: ["Green"],               lat: 38.9540, lng: -95.2590, near: "Engel Rd. (Daisy Hill)" },
  { lot: "Lot 104", colors: ["Red", "Green"],        lat: 38.9510, lng: -95.2560, near: "W. Ellsworth Hall" },
  { lot: "Lot 105", colors: ["Green"],               lat: 38.9510, lng: -95.2560, near: "S. Ellsworth Hall" },
  { lot: "Lot 109", colors: ["Red", "Green"],        lat: 38.9566, lng: -95.2530, near: "S. Jayhawker Towers" },
  { lot: "Lot 110", colors: ["Green"],               lat: 38.9566, lng: -95.2530, near: "E. Jayhawker Towers" },
  { lot: "Lot 111", colors: ["Red", "Green"],        lat: 38.9660, lng: -95.2440, near: "GSP & Corbin Halls" },
  { lot: "Lot 112", colors: ["Red", "Green"],        lat: 38.9510, lng: -95.2510, near: "McCarthy Hall" },
  { lot: "Lot 113", colors: ["Red", "Green"],        lat: 38.9510, lng: -95.2530, near: "Downs Hall" },
  { lot: "Lot 114", colors: ["Green"],               lat: 38.9510, lng: -95.2560, near: "W. Stouffer Place" },
  { lot: "Lot 115", colors: ["Green"],               lat: 38.9510, lng: -95.2530, near: "E. Stouffer Place" },
  { lot: "Lot 116", colors: ["Green"],               lat: 38.9510, lng: -95.2530, near: "Downs Hall" },
  { lot: "Lot 119", colors: ["Green"],               lat: 38.9510, lng: -95.2560, near: "Ellis Drive" },
  { lot: "Lot 120", colors: ["Green"],               lat: 38.9633, lng: -95.2420, near: "11th & Louisiana" },
  { lot: "Lot 130", colors: ["Green"],               lat: 38.9540, lng: -95.2560, near: "N. Stouffer Place" },

  { lot: "Lot 100", colors: ["Red", "Brown"],        lat: 38.9585, lng: -95.2420, near: "Alumni Place" },
  { lot: "Lot 107", colors: ["Brown"],               lat: 38.9566, lng: -95.2420, near: "E. Sellards Hall" },
  { lot: "Lot 121", colors: ["Brown"],               lat: 38.9585, lng: -95.2420, near: "Amini Halls" },
  { lot: "Lot 122", colors: ["Brown"],               lat: 38.9585, lng: -95.2420, near: "Louisiana Street" },
  { lot: "Lot 123", colors: ["Brown"],               lat: 38.9600, lng: -95.2420, near: "13th Street" },
  { lot: "Lot 124", colors: ["Red", "Brown"],        lat: 38.9600, lng: -95.2420, near: "13th & Louisiana" },

  { lot: "Lot 131", colors: ["Orange"],              lat: 38.9510, lng: -95.2490, near: "E. Naismith Hall" },
  { lot: "Lot 132", colors: ["Orange"],              lat: 38.9510, lng: -95.2490, near: "E. Arkansas St" },
  { lot: "Lot 134", colors: ["Fuchsia"],             lat: 38.9633, lng: -95.2490, near: "Hawker Apartments" },

  { lot: "Lot 300A", colors: ["Red", "Yellow"],      lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300B", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300C", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300D", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300E", colors: ["Blue", "Red", "Green"], lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 300F", colors: ["Green"],              lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 300G", colors: ["Green"],              lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 303",  colors: ["Red"],                lat: 38.9460, lng: -95.2650, near: "W. Park & Ride" },

  { lot: "Allen Fieldhouse Garage",  colors: ["Garage"], lat: 38.954306, lng: -95.252394, near: "Naismith Dr & Irving Hill Rd" },
  { lot: "Central District Garage",  colors: ["Garage"], lat: 38.9566, lng: -95.2560, near: "1631 Ousdahl Road" },
  { lot: "Mississippi Street Garage",colors: ["Garage"], lat: 38.9600, lng: -95.2440, near: "1261 Oread Avenue" },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "at", "on", "in", "and", "or", "to",
  "ku", "kansas", "university", "hall", "building", "bldg",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

function tokenScore(query: string, candidate: string): number {
  const qTokens = tokenize(query);
  const cTokens = tokenize(candidate);
  if (qTokens.length === 0 || cTokens.length === 0) return 0;
  const qSet = new Set(qTokens);
  const cSet = new Set(cTokens);
  let overlap = 0;
  for (const t of qSet) if (cSet.has(t)) overlap++;
  if (overlap === 0) return 0;
  const precision = overlap / qSet.size;
  const recall = overlap / cSet.size;
  return (2 * precision * recall) / (precision + recall);
}

function matchBuilding(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const names = Object.keys(KU_BUILDINGS);

  for (const name of names) {
    if (name.toLowerCase() === q) return name;
  }
  for (const name of names) {
    for (const alias of BUILDING_ALIASES[name] || []) {
      if (alias.toLowerCase() === q) return name;
    }
  }

  for (const name of names) {
    if (name.toLowerCase().includes(q) || q.includes(name.toLowerCase())) return name;
  }
  for (const name of names) {
    const shortKey = name.split("(")[0].trim().toLowerCase();
    if (shortKey && (q.includes(shortKey) || shortKey.includes(q))) return name;
  }
  for (const name of names) {
    for (const alias of BUILDING_ALIASES[name] || []) {
      const al = alias.toLowerCase();
      if (q.includes(al) || al.includes(q)) return name;
    }
  }

  let bestName: string | null = null;
  let bestScore = 0;
  for (const name of names) {
    const candidates = [name, ...(BUILDING_ALIASES[name] || [])];
    for (const cand of candidates) {
      const score = tokenScore(q, cand);
      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }
  }
  return bestScore >= 0.5 ? bestName : null;
}

function googleMapsPin(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// -----------------------------------------------------------------------------
// Tool implementations
// -----------------------------------------------------------------------------

function listKuBuildings(): string {
  return Object.keys(KU_BUILDINGS)
    .map((name) => `- ${name}`)
    .join("\n");
}

function findParkingNearBuilding(
  buildingName: string,
  maxDistanceMiles = 2.0,
  topK = 5,
): string {
  const matched = matchBuilding(buildingName);
  if (matched === null) {
    return (
      `No KU building matches "${buildingName}". Try a different phrasing or a ` +
      `nearby landmark -- informal names like "the phog", "business school", ` +
      `"student union", or "Ambler gym" also work.`
    );
  }

  const [targetLat, targetLng] = KU_BUILDINGS[matched];

  const ranked = KU_PARKING_LOTS.map((lot) => {
    const dist = haversineMiles(targetLat, targetLng, lot.lat, lot.lng);
    return {
      lot: lot.lot,
      colors: lot.colors.join("/"),
      near: lot.near,
      distance_miles: Number(dist.toFixed(3)),
      walk_minutes: Math.round(dist * 20),
      google_maps: googleMapsPin(lot.lat, lot.lng),
    };
  });

  ranked.sort((a, b) => a.distance_miles - b.distance_miles);
  const withinRange = ranked.filter((r) => r.distance_miles <= maxDistanceMiles);

  if (withinRange.length === 0) {
    return `No parking lots within ${maxDistanceMiles} miles of ${matched}. Try the Park & Ride shuttle or increase the radius.`;
  }

  const header = `Parking lots within ${maxDistanceMiles} miles of ${matched} (top ${topK}, ranked by distance):\n`;
  const lines = [header];
  withinRange.slice(0, topK).forEach((r, i) => {
    lines.push(
      `  ${i + 1}. ${r.lot} (${r.colors}) near ${r.near} - ${r.distance_miles} mi (${r.walk_minutes} min walk) -> ${r.google_maps}`,
    );
  });
  return lines.join("\n");
}

function getParkingColorsLegend(): string {
  return [
    "KU parking color legend (2024-25, source: parking.ku.edu):",
    "",
    "Faculty/staff permits (tiered -- each higher tier also covers lower tiers):",
    "- Yellow: basic permit ($310/yr). All faculty and staff. Off-campus students also buy this tier.",
    "- Red:    general faculty/staff permit ($388/yr). Covers Red, Yellow, Park & Ride, and most Housing lots.",
    "- Blue:   senior faculty/staff permit ($435/yr). Eligibility: employee age + years of service >= 62.",
    "- Gold:   premium permit ($585/yr). Eligibility: age + years of service >= 70, primary workplace in central campus.",
    "",
    "Student housing permits ($340/yr each; valid in Green zones + lot-specific overrides):",
    "- Green:   Daisy Hill, GSP/Corbin, Central District, Jayhawker Towers, and Stouffer Place residents.",
    "- Orange:  Naismith Hall residents.",
    "- Brown:   Alumni Place / Scholarship Hall residents.",
    "- Fuchsia: Hawker Apartments residents.",
    "",
    "Everyone else:",
    "- Visitor:       $4/day pay-by-space in Yellow or Green zones.",
    "- Park & Ride:   Free remote lot with shuttle service. Included with Red/Blue/Gold permits.",
    "- Garage:        Allen Fieldhouse / Central District / Mississippi Street garages have their own permits, plus open hourly rates for visitors ($2.25 first hour, $2.00 each hour after). Garages are preempted during home athletic events with 48-hour notice.",
  ].join("\n");
}

// -----------------------------------------------------------------------------
// MCP tool schema
// -----------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_ku_buildings",
    description: "List all KU buildings available for parking lookup. Returns a newline-separated list of building names.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "find_parking_near_building",
    description:
      "Find the nearest parking lots within a given radius of a KU building. Approximate matching is supported -- informal names, abbreviations, and partial phrases all resolve to the right building. Examples: 'business school' -> Capitol Federal Hall (Business School); 'ambler', 'ambler gym', 'student gym', or 'fitness center' -> Ambler Student Recreation Fitness Center; 'the union' or 'student union' -> Kansas Union; 'the phog' -> Allen Fieldhouse. Returns a ranked list where each lot includes all applicable permit colors (slash-separated for multi-zone lots), a location hint, distance in miles, walk time, and a Google Maps pin URL.",
    inputSchema: {
      type: "object",
      properties: {
        building_name: {
          type: "string",
          description: "Name (or partial name) of a KU building.",
        },
        max_distance_miles: {
          type: "number",
          description: "Maximum search radius in miles. Defaults to 2.0.",
          default: 2.0,
        },
        top_k: {
          type: "integer",
          description: "Maximum number of parking lots to return. Defaults to 5.",
          default: 5,
        },
      },
      required: ["building_name"],
    },
  },
  {
    name: "get_parking_colors_legend",
    description: "Return the KU parking color legend, grouped by faculty/staff tiered permits, student housing permits, and everyone-else options (Visitor, Park & Ride, Garage). Sourced from parking.ku.edu.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

function dispatchToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "list_ku_buildings":
      return listKuBuildings();
    case "find_parking_near_building":
      return findParkingNearBuilding(
        String(args.building_name ?? ""),
        Number(args.max_distance_miles ?? 2.0),
        Number(args.top_k ?? 5),
      );
    case "get_parking_colors_legend":
      return getParkingColorsLegend();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// -----------------------------------------------------------------------------
// MCP JSON-RPC 2.0 handler
// -----------------------------------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

function handleMcpRequest(req: JsonRpcRequest): Record<string, unknown> {
  const { id, method, params } = req;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "ku-parking", version: "2.0.0" },
      },
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === "tools/call") {
    const name = String((params as { name?: string })?.name ?? "");
    const args = ((params as { arguments?: Record<string, unknown> })?.arguments) ?? {};
    try {
      const text = dispatchToolCall(name, args);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text }],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: (err as Error).message },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// -----------------------------------------------------------------------------
// Supabase Edge Function entry point
// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        server: "ku-parking",
        version: "2.0.0",
        protocol: "mcp/jsonrpc-2.0",
        tools: TOOLS.map((t) => t.name),
        note: "POST JSON-RPC 2.0 requests here. See README for examples.",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }),
      { status: 400, headers: { "content-type": "application/json", ...CORS_HEADERS } },
    );
  }

  const responses = Array.isArray(body)
    ? body.map(handleMcpRequest)
    : handleMcpRequest(body);

  return new Response(JSON.stringify(responses), {
    status: 200,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
});
