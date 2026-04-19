// KU Parking MCP Server -- Supabase Edge Function (Deno runtime)
//
// This file implements the same parking lookup service as ku_parking_mcp.py,
// but as a Supabase Edge Function that speaks MCP over HTTP. Deploy it once
// and any MCP-compatible client (Dify, n8n, Python, Claude Desktop, a web app)
// can call the same tools by sending JSON-RPC requests to the public URL.
//
// Deploy:
//     cd Agentic/mcp/supabase
//     supabase functions deploy ku-parking --no-verify-jwt
//
// Public URL format:
//     https://<project-ref>.supabase.co/functions/v1/ku-parking
//
// This handler speaks MCP's JSON-RPC 2.0 protocol directly (the "initialize",
// "tools/list", and "tools/call" methods). We keep the implementation minimal
// and hand-rolled to avoid pulling in the full MCP TypeScript SDK -- Supabase
// Edge Functions cold-start faster when there are fewer imports.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// -----------------------------------------------------------------------------
// Data -- same verified coordinates as ku_parking_mcp.py and the Dify KB files
// Update all three places together if you change a building or lot.
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

// Informal names, nicknames, and school/department associations people actually
// type. Any of these should resolve to the canonical building name above.
const BUILDING_ALIASES: Record<string, string[]> = {
  "Capitol Federal Hall (Business School)": [
    "business school", "b-school", "bschool", "biz school",
    "school of business", "ku business school", "ku business",
    "capitol federal", "capitol federal hall", "capfed", "cap fed",
  ],
  "Kansas Union":                            [
    "union", "student union", "ku union", "the union", "ku student union",
    "memorial union", "bookstore",
  ],
  "Allen Fieldhouse":                        [
    "allen", "fieldhouse", "the phog", "phog", "phog allen",
    "basketball stadium", "phog stadium", "basketball arena",
    "ku basketball", "basketball", "jayhawk basketball",
  ],
  "Strong Hall":                             [
    "strong", "admin building", "administration", "admin",
    "chancellor", "chancellor's office",
  ],
  "Watson Library":                          [
    "watson", "watson lib", "main library", "research library",
    "ku library",
  ],
  "Anschutz Library":                        [
    "anschutz", "anschutz lib", "science library", "stem library",
  ],
  "Dyche Hall":                              [
    "dyche", "natural history museum", "nhm",
    "biodiversity institute", "museum of natural history",
  ],
  "Fraser Hall":                             [
    "fraser", "psychology building", "psych building",
  ],
  "Lied Center":                             [
    "lied", "performing arts", "performing arts center",
    "concert hall", "theater",
  ],
  "Memorial Stadium":                        [
    "stadium", "football stadium", "memorial", "kivisto field",
    "ku football", "football arena", "jayhawk football",
  ],
  "Wescoe Hall":                             [
    "wescoe", "wescoe beach", "liberal arts building",
    "college of liberal arts", "humanities building",
  ],
  "Spencer Museum of Art":                   [
    "spencer", "spencer museum", "art museum", "museum of art",
  ],
  "Ambler Student Recreation Fitness Center":[
    "ambler", "ambler gym", "ambler fitness", "ambler fitness center",
    "ambler rec", "ambler rec center", "ambler recreation",
    "ambler srfc", "srfc",
    "student gym", "student rec", "student rec center",
    "recreation center", "fitness center", "rec center",
    "campus gym", "campus rec", "ku gym", "the rec", "gym",
  ],
};

interface ParkingLot {
  lot: string;
  color: string;
  lat: number;
  lng: number;
}

const KU_PARKING_LOTS: ParkingLot[] = [
  { lot: "Lot 3"                    , color: "Blue"      , lat: 38.958942, lng: -95.247614 },
  { lot: "Lot 5"                    , color: "Yellow"    , lat: 38.95861, lng: -95.24441 },
  { lot: "Lot 10"                   , color: "Blue"      , lat: 38.956221, lng: -95.244787 },
  { lot: "Lot 14"                   , color: "Yellow"    , lat: 38.95716, lng: -95.24307 },
  { lot: "Lot 16"                   , color: "Visitor"   , lat: 38.9592, lng: -95.24298 },
  { lot: "Lot 18"                   , color: "Yellow"    , lat: 38.95703, lng: -95.24783 },
  { lot: "Lot 60"                   , color: "Blue"      , lat: 38.96333, lng: -95.24691 },
  { lot: "Lot 70"                   , color: "Blue"      , lat: 38.953906, lng: -95.252394 },
  { lot: "Lot 71"                   , color: "Yellow"    , lat: 38.953666, lng: -95.252394 },
  { lot: "Lot 90"                   , color: "Gold"      , lat: 38.952512, lng: -95.247929 },
  { lot: "Lot 91"                   , color: "Gold"      , lat: 38.959634, lng: -95.244569 },
  { lot: "Lot 118"                  , color: "Gold"      , lat: 38.953505, lng: -95.24974 },
  { lot: "Lot 300A-D"               , color: "Gold"      , lat: 38.95494, lng: -95.26237 },
  { lot: "Lot 300E-G"               , color: "Gold"      , lat: 38.95494, lng: -95.26289 },
  { lot: "Allen Fieldhouse Garage"  , color: "Gold"      , lat: 38.954306, lng: -95.252394 },
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

// Very small stopword list -- filler words that should not drive a token match.
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

// F1-style token overlap score between two strings (0 to 1).
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

// Approximate building match. Order of preference:
//   1. Exact match on canonical name or alias
//   2. Substring match (query in name, or query in alias, or alias in query)
//   3. Token-overlap scoring across canonical names and aliases
// Returns the canonical building name, or null if nothing is confident enough.
function matchBuilding(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const names = Object.keys(KU_BUILDINGS);

  // 1a. Exact match on canonical name
  for (const name of names) {
    if (name.toLowerCase() === q) return name;
  }
  // 1b. Exact match on an alias
  for (const name of names) {
    for (const alias of BUILDING_ALIASES[name] || []) {
      if (alias.toLowerCase() === q) return name;
    }
  }

  // 2a. Substring match against canonical name
  for (const name of names) {
    if (name.toLowerCase().includes(q) || q.includes(name.toLowerCase())) return name;
  }
  // 2b. Reverse substring on the non-parenthetical short form
  for (const name of names) {
    const shortKey = name.split("(")[0].trim().toLowerCase();
    if (shortKey && (q.includes(shortKey) || shortKey.includes(q))) return name;
  }
  // 2c. Substring either direction against any alias
  for (const name of names) {
    for (const alias of BUILDING_ALIASES[name] || []) {
      const al = alias.toLowerCase();
      if (q.includes(al) || al.includes(q)) return name;
    }
  }

  // 3. Token-overlap scoring across canonical name + all aliases
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
  // Require meaningful overlap so random words do not latch onto a building.
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
      color: lot.color,
      distance_miles: Number(dist.toFixed(3)),
      walk_minutes: Math.round(dist * 20), // ~3 mph walking
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
      `  ${i + 1}. ${r.lot} (${r.color}) - ${r.distance_miles} mi (${r.walk_minutes} min walk) -> ${r.google_maps}`,
    );
  });
  return lines.join("\n");
}

function getParkingColorsLegend(): string {
  return (
    "KU parking color legend:\n" +
    "- Blue: student commuter permit\n" +
    "- Yellow: faculty/staff permit\n" +
    "- Gold: premium permit (close to central campus)\n" +
    "- Red: restricted/reserved\n" +
    "- Visitor: open to visitors, often metered or short-term\n" +
    "- Park & Ride: free remote lot with shuttle service"
  );
}

// -----------------------------------------------------------------------------
// MCP tool schema (what clients see when they call tools/list)
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
      "Find the nearest parking lots within a given radius of a KU building. Approximate matching is supported -- informal names, abbreviations, and partial phrases all resolve to the right building. Examples: 'business school' -> Capitol Federal Hall (Business School); 'ambler', 'ambler gym', 'student gym', or 'fitness center' -> Ambler Student Recreation Fitness Center; 'the union' or 'student union' -> Kansas Union; 'the phog' -> Allen Fieldhouse. Returns a ranked list with permit color, distance in miles, walk time, and a Google Maps pin URL for each lot.",
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
    description: "Return the KU parking color code legend explaining what each permit color means.",
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
// Minimal MCP JSON-RPC 2.0 handler
//
// We implement only the three methods a typical client needs:
//   initialize     -- handshake
//   tools/list     -- return tool schemas
//   tools/call     -- execute a named tool
//
// This avoids pulling in the full MCP SDK, which speeds up cold starts on
// Supabase Edge Functions. For a production server you'd use the official
// @modelcontextprotocol/sdk package.
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
        serverInfo: { name: "ku-parking", version: "1.0.0" },
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Simple GET -- health check / discovery
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        server: "ku-parking",
        version: "1.0.0",
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

  // POST -- MCP JSON-RPC requests
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

  // Support batch requests (an array of JSON-RPC requests)
  const responses = Array.isArray(body)
    ? body.map(handleMcpRequest)
    : handleMcpRequest(body);

  return new Response(JSON.stringify(responses), {
    status: 200,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
});
