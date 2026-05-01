// KU Parking MCP Server -- Google Cloud Run (Deno runtime)
//
// Same MCP server as ../supabase/functions/ku-parking/index.ts, but packaged
// as a container for Cloud Run instead of a Supabase Edge Function. The only
// differences from the Supabase version are:
//   1. Uses built-in Deno.serve instead of std/http (no external import)
//   2. Binds to the PORT env var that Cloud Run injects (defaults to 8080)
//
// Deploy:
//     cd infra/ku-parking-mcp/cloudrun
//     gcloud run deploy ku-parking-mcp --source . \
//         --region us-central1 --allow-unauthenticated
//
// Public URL format (assigned after first deploy):
//     https://ku-parking-mcp-<hash>-<region>.run.app
//
// Data source:
//     Refreshed 2026-04-23 from KU's official 2024-25 Lawrence Campus
//     Parking Map PDF:
//     https://parking.ku.edu/sites/parking/files/documents/parkingmap.pdf
//     Plus the permit category pages under https://parking.ku.edu/ for
//     eligibility and pricing context.
//
//     Most lot coordinates are approximate (estimated from the PDF's A-L / 1-10
//     grid using a handful of hand-verified anchor points). Ranking order is
//     reliable within ~200m, which is fine for a "which lot is closest" demo
//     but should not be used for precise navigation.

// -----------------------------------------------------------------------------
// Buildings
// -----------------------------------------------------------------------------

type Coords = [number, number];

// 13 hand-verified entries followed by ~80 more derived from the 2024-25 PDF
// map's A-L / 1-10 grid codes. Grid-based coords are accurate to ~150-200m,
// good for "which lot is closest" ranking but not for navigation precision.
const KU_BUILDINGS: Record<string, Coords> = {
  // -- Hand-verified (the 13 most-asked-about buildings) --
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

  // -- North & Central districts (grid-based) --
  "Adams Alumni Center":                     [38.961, -95.244],
  "Anderson Family Football Complex":        [38.963, -95.247],
  "Anschutz Sports Pavilion":                [38.954, -95.254],
  "Bailey Hall":                             [38.958, -95.247],
  "Blake Hall":                              [38.957, -95.244],
  "Booth Family Hall of Athletics":          [38.954, -95.252],
  "Budig Hall":                              [38.958, -95.250],
  "Burge Student Union":                     [38.957, -95.254],
  "Memorial Campanile":                      [38.961, -95.247],
  "Carruth-O'Leary Hall":                    [38.961, -95.250],
  "Central District Parking Garage":         [38.957, -95.257],
  "Chalmers Hall":                           [38.958, -95.252],
  "Crawford Community Center":               [38.958, -95.241],
  "Daisy Hill Commons":                      [38.957, -95.260],
  "Danforth Chapel":                         [38.958, -95.244],
  "DeBruce Center":                          [38.957, -95.252],
  "Dole Human Development Center":           [38.957, -95.247],
  "Eaton Hall":                              [38.958, -95.252],
  "Ekdahl Dining Commons":                   [38.957, -95.257],
  "Football Indoor Practice Facility":       [38.963, -95.250],
  "Gertrude Sellards Pearson Residence Hall":[38.966, -95.244],
  "Gray-Little Hall":                        [38.957, -95.254],
  "Green Hall":                              [38.957, -95.252],
  "Hall Center for the Humanities":          [38.957, -95.247],
  "Hawker Apartments":                       [38.966, -95.250],
  "Haworth Hall":                            [38.957, -95.250],
  "Horejsi Family Volleyball Arena":         [38.954, -95.252],
  "Jayhawker Towers Apartments":             [38.957, -95.254],
  "Jayhawk Welcome Center":                  [38.961, -95.244],
  "Joseph R. Pearson Hall":                  [38.963, -95.250],
  "Learned Hall":                            [38.958, -95.252],
  "Learned Engineering Building (LEEP2)":    [38.958, -95.252],
  "Lindley Hall":                            [38.958, -95.250],
  "Lippincott Hall":                         [38.958, -95.244],
  "Malott Hall":                             [38.957, -95.250],
  "Marvin Hall":                             [38.958, -95.250],
  "McCarthy Hall Apartments":                [38.952, -95.252],
  "Mississippi Street Parking Garage":       [38.961, -95.244],
  "Murphy Hall":                             [38.957, -95.252],
  "Nunemaker Center":                        [38.957, -95.257],
  "Price Computing Center":                  [38.957, -95.247],
  "Ritchie Hall":                            [38.958, -95.252],
  "Robinson Health & PE Center":             [38.954, -95.250],
  "Sabatini Multicultural Resource Center":  [38.961, -95.244],
  "Slawson Hall":                            [38.958, -95.252],
  "Smith Hall":                              [38.961, -95.244],
  "Snow Hall":                               [38.958, -95.250],
  "South Dining Commons":                    [38.952, -95.252],
  "Spahr Engineering Library":               [38.958, -95.252],
  "Spencer Research Library":                [38.958, -95.247],
  "Spooner Hall":                            [38.958, -95.244],
  "Stauffer-Flint Hall":                     [38.957, -95.247],
  "Summerfield Hall":                        [38.957, -95.250],
  "Twente Hall":                             [38.957, -95.244],
  "Wagnon-Parrott Athletic Center":          [38.954, -95.252],
  "Watkins Memorial Health Center":          [38.954, -95.250],

  // -- Residence halls (grid-based) --
  "Corbin Residence Hall":                   [38.966, -95.241],
  "Downs Residence Hall":                    [38.952, -95.252],
  "Ellsworth Residence Hall":                [38.954, -95.257],
  "Hashinger Residence Hall":                [38.954, -95.257],
  "Lewis Residence Hall":                    [38.957, -95.257],
  "Oswald Residence Hall":                   [38.957, -95.260],
  "Self Residence Hall":                     [38.957, -95.260],
  "Stouffer Place Apartments":               [38.952, -95.257],
  "Templin Residence Hall":                  [38.957, -95.257],

  // -- Scholarship Halls (grid-based) --
  "K.K. Amini Scholarship Hall":             [38.958, -95.241],
  "Margaret Amini Scholarship Hall":         [38.958, -95.241],
  "Battenfeld Scholarship Hall":             [38.958, -95.244],
  "Douthart Scholarship Hall":               [38.958, -95.244],
  "Krehbiel Scholarship Hall":               [38.961, -95.241],
  "Miller Scholarship Hall":                 [38.957, -95.244],
  "Grace Pearson Scholarship Hall":          [38.958, -95.244],
  "Pearson Scholarship Hall":                [38.958, -95.241],
  "Dennis E. Rieger Scholarship Hall":       [38.958, -95.241],
  "Sellards Scholarship Hall":               [38.957, -95.241],
  "Stephenson Scholarship Hall":             [38.958, -95.241],
  "Watkins Scholarship Hall":                [38.957, -95.244],

  // -- West district (grid-based) --
  "Bales Organ Recital Hall":                [38.954, -95.263],
  "Dole Institute of Politics":              [38.957, -95.263],
  "Foley Hall":                              [38.949, -95.263],
  "Higuchi Hall":                            [38.946, -95.260],
  "KU Innovation Park":                      [38.946, -95.268],
  "Library Annex":                           [38.949, -95.268],
  "McCollum Laboratories":                   [38.946, -95.260],
  "Moore Hall":                              [38.949, -95.260],
  "Multidisciplinary Research Building":     [38.946, -95.263],
  "Nichols Hall":                            [38.952, -95.263],
  "Parker Hall":                             [38.949, -95.260],
  "Pharmacy Building":                       [38.949, -95.263],
  "Public Safety Building":                  [38.957, -95.266],
};

const BUILDING_ALIASES: Record<string, string[]> = {
  // -- Original 13 (kept verbatim) --
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

  // -- North & Central districts --
  "Adams Alumni Center":           ["adams", "alumni center", "alumni", "aac"],
  "Anderson Family Football Complex": ["anderson football", "football complex", "afoc"],
  "Anschutz Sports Pavilion":      ["anschutz pavilion", "sports pavilion", "ansp"],
  "Bailey Hall":                   ["bailey"],
  "Blake Hall":                    ["blake"],
  "Booth Family Hall of Athletics":["booth athletics", "booth hall", "athletics hall", "bf"],
  "Budig Hall":                    ["budig", "hoch auditoria", "hoch", "bud"],
  "Burge Student Union":           ["burge", "burge union", "north union"],
  "Memorial Campanile":            ["campanile", "bell tower", "memorial bell", "the campanile"],
  "Carruth-O'Leary Hall":          ["carruth", "o'leary", "carruth-oleary", "carruth oleary"],
  "Central District Parking Garage":["central garage", "central district garage", "cdp", "cdp1"],
  "Chalmers Hall":                 ["chalmers", "chal"],
  "Crawford Community Center":     ["crawford", "craw"],
  "Daisy Hill Commons":            ["daisy hill", "daisy hill commons", "dhc"],
  "Danforth Chapel":               ["danforth", "chapel", "danf"],
  "DeBruce Center":                ["debruce", "dbr"],
  "Dole Human Development Center": ["dole human development", "human development", "dole hdc", "dhdc"],
  "Eaton Hall": [
    "eaton", "computer science", "cs", "eecs", "electrical engineering",
    "school of engineering", "engineering school", "engineering computing",
  ],
  "Ekdahl Dining Commons":         ["ekdahl", "mrs e's", "mrs es", "north dining", "ekd"],
  "Football Indoor Practice Facility":["indoor practice", "football indoor", "foot"],
  "Gertrude Sellards Pearson Residence Hall":["gsp", "gsph", "gertrude sellards pearson", "gertrude pearson"],
  "Gray-Little Hall":              ["gray little", "gray-little", "gl"],
  "Green Hall":                    ["green hall", "law school", "ku law", "school of law", "law", "law building"],
  "Hall Center for the Humanities":["hall center", "humanities center"],
  "Hawker Apartments":             ["hawker", "hawk apartments"],
  "Haworth Hall":                  ["haworth", "biology building", "biology", "biological sciences", "bio"],
  "Horejsi Family Volleyball Arena":["horejsi", "volleyball arena", "volleyball", "hfam"],
  "Jayhawker Towers Apartments":   ["jayhawker towers", "the towers", "jt"],
  "Jayhawk Welcome Center":        ["welcome center", "jayhawk welcome", "jwc"],
  "Joseph R. Pearson Hall":        ["jrp", "joseph pearson", "jrp hall", "jr pearson"],
  "Learned Hall": [
    "learned", "engineering", "engineering building", "school of engineering",
    "ku engineering", "engineering complex", "lea",
    "mechanical engineering", "aerospace engineering", "civil engineering",
  ],
  "Learned Engineering Building (LEEP2)":["leep", "leep2", "engineering phase 2", "new engineering"],
  "Lindley Hall":                  ["lindley", "geography", "geography building", "lin"],
  "Lippincott Hall":               ["lippincott", "lipp"],
  "Malott Hall":                   ["malott", "chemistry building", "chem", "chemistry", "mal"],
  "Marvin Hall":                   ["marvin", "architecture", "design school", "school of architecture", "architecture school", "mar"],
  "McCarthy Hall Apartments":      ["mccarthy", "mccarthy hall", "msmh"],
  "Mississippi Street Parking Garage":["mississippi garage", "mspk", "mississippi street garage", "mississippi"],
  "Murphy Hall":                   ["murphy", "music school", "school of music", "music", "theatre", "crafton-preyer", "mur"],
  "Nunemaker Center":              ["nunemaker", "nun"],
  "Price Computing Center":        ["price computing", "computing center", "price", "comp"],
  "Ritchie Hall":                  ["ritchie", "earth energy environment", "rit"],
  "Robinson Health & PE Center":   ["robinson", "rob", "physical education", "pe building"],
  "Sabatini Multicultural Resource Center":["sabatini", "multicultural", "smrc"],
  "Slawson Hall":                  ["slawson", "earth science", "slaw"],
  "Smith Hall":                    ["smith", "smi"],
  "Snow Hall":                     ["snow", "math building", "math department", "math hall", "school of math", "mathematics", "math"],
  "South Dining Commons":          ["south dining", "south commons", "dine"],
  "Spahr Engineering Library":     ["spahr", "engineering library", "engineering lib", "sphr"],
  "Spencer Research Library":      ["spencer research", "research library", "srl"],
  "Spooner Hall":                  ["spooner", "sp"],
  "Stauffer-Flint Hall":           ["stauffer", "stauffer flint", "stauffer-flint", "journalism school", "school of journalism", "journalism", "j school", "stfl"],
  "Summerfield Hall":              ["summerfield", "sum"],
  "Twente Hall":                   ["twente", "social welfare", "school of social welfare", "twe"],
  "Wagnon-Parrott Athletic Center":["wagnon", "wagnon-parrott", "wpac"],
  "Watkins Memorial Health Center":["watkins health", "student health", "health center", "wmhc"],

  // -- Residence halls --
  "Corbin Residence Hall":         ["corbin", "corbin hall"],
  "Downs Residence Hall":          ["downs", "downs hall"],
  "Ellsworth Residence Hall":      ["ellsworth", "ellsworth hall"],
  "Hashinger Residence Hall":      ["hashinger", "hash"],
  "Lewis Residence Hall":          ["lewis", "lewis hall"],
  "Oswald Residence Hall":         ["oswald", "oswald hall"],
  "Self Residence Hall":           ["self", "self hall"],
  "Stouffer Place Apartments":     ["stouffer", "stouffer place", "stou"],
  "Templin Residence Hall":        ["templin", "templin hall"],

  // -- Scholarship Halls --
  "K.K. Amini Scholarship Hall":         ["k.k. amini", "kk amini", "amini hall"],
  "Margaret Amini Scholarship Hall":     ["margaret amini"],
  "Battenfeld Scholarship Hall":         ["battenfeld"],
  "Douthart Scholarship Hall":           ["douthart"],
  "Krehbiel Scholarship Hall":           ["krehbiel"],
  "Miller Scholarship Hall":             ["miller scholarship", "miller hall"],
  "Grace Pearson Scholarship Hall":      ["grace pearson"],
  "Pearson Scholarship Hall":            ["pearson scholarship"],
  "Dennis E. Rieger Scholarship Hall":   ["rieger"],
  "Sellards Scholarship Hall":           ["sellards"],
  "Stephenson Scholarship Hall":         ["stephenson"],
  "Watkins Scholarship Hall":            ["watkins scholarship"],

  // -- West district --
  "Bales Organ Recital Hall":      ["bales", "bales organ", "organ hall", "recital hall"],
  "Dole Institute of Politics":    ["dole institute", "dole politics", "dole"],
  "Foley Hall":                    ["foley", "fole"],
  "Higuchi Hall":                  ["higuchi", "higu"],
  "KU Innovation Park":            ["innovation park", "kuip"],
  "Library Annex":                 ["library annex", "libx"],
  "McCollum Laboratories":         ["mccollum", "mcl"],
  "Moore Hall":                    ["moore", "moor"],
  "Multidisciplinary Research Building":["mrb", "multidisciplinary research"],
  "Nichols Hall":                  ["nichols", "nic"],
  "Parker Hall":                   ["parker", "kansas geological survey", "geological survey", "par"],
  "Pharmacy Building":             ["pharmacy", "pharmacy school", "school of pharmacy", "phar"],
  "Public Safety Building":        ["public safety", "psb", "campus police"],
};

// -----------------------------------------------------------------------------
// Parking lots
// -----------------------------------------------------------------------------

interface ParkingLot {
  lot: string;
  colors: string[]; // one lot may span multiple permit zones; order = most restrictive first
  lat: number;
  lng: number;
  near: string;     // human-readable location hint from the PDF parking index
}

const KU_PARKING_LOTS: ParkingLot[] = [
  // --- Central campus: Gold / Blue / Red zones along Jayhawk Blvd ---
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

  // --- Yellow (basic faculty/staff + off-campus students) ---
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

  // --- University housing: Green (Daisy Hill + Central District + GSP/Corbin + Jayhawker Towers) ---
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

  // --- Scholarship Halls (Brown / Alumni Place) ---
  { lot: "Lot 100", colors: ["Red", "Brown"],        lat: 38.9585, lng: -95.2420, near: "Alumni Place" },
  { lot: "Lot 107", colors: ["Brown"],               lat: 38.9566, lng: -95.2420, near: "E. Sellards Hall" },
  { lot: "Lot 121", colors: ["Brown"],               lat: 38.9585, lng: -95.2420, near: "Amini Halls" },
  { lot: "Lot 122", colors: ["Brown"],               lat: 38.9585, lng: -95.2420, near: "Louisiana Street" },
  { lot: "Lot 123", colors: ["Brown"],               lat: 38.9600, lng: -95.2420, near: "13th Street" },
  { lot: "Lot 124", colors: ["Red", "Brown"],        lat: 38.9600, lng: -95.2420, near: "13th & Louisiana" },

  // --- Naismith Hall (Orange) & Hawker Apartments (Fuchsia) ---
  { lot: "Lot 131", colors: ["Orange"],              lat: 38.9510, lng: -95.2490, near: "E. Naismith Hall" },
  { lot: "Lot 132", colors: ["Orange"],              lat: 38.9510, lng: -95.2490, near: "E. Arkansas St" },
  { lot: "Lot 134", colors: ["Fuchsia"],             lat: 38.9633, lng: -95.2490, near: "Hawker Apartments" },

  // --- West campus (Lied Center and beyond) ---
  { lot: "Lot 300A", colors: ["Red", "Yellow"],      lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300B", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300C", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300D", colors: ["Yellow"],             lat: 38.954940, lng: -95.262370, near: "Lied Center" },
  { lot: "Lot 300E", colors: ["Blue", "Red", "Green"], lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 300F", colors: ["Green"],              lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 300G", colors: ["Green"],              lat: 38.954940, lng: -95.262890, near: "Lied Center" },
  { lot: "Lot 303",  colors: ["Red"],                lat: 38.9460, lng: -95.2650, near: "W. Park & Ride" },

  // --- Parking garages ---
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
    "- Yellow: basic permit (USD 310/yr). All faculty and staff. Off-campus students also buy this tier.",
    "- Red:    general faculty/staff permit (USD 388/yr). Covers Red, Yellow, Park & Ride, and most Housing lots.",
    "- Blue:   senior faculty/staff permit (USD 435/yr). Eligibility: employee age + years of service >= 62.",
    "- Gold:   premium permit (USD 585/yr). Eligibility: age + years of service >= 70, primary workplace in central campus.",
    "",
    "Student housing permits (USD 340/yr each; valid in Green zones + lot-specific overrides):",
    "- Green:   Daisy Hill, GSP/Corbin, Central District, Jayhawker Towers, and Stouffer Place residents.",
    "- Orange:  Naismith Hall residents.",
    "- Brown:   Alumni Place / Scholarship Hall residents.",
    "- Fuchsia: Hawker Apartments residents.",
    "",
    "Everyone else:",
    "- Visitor:       USD 4 per day pay-by-space in Yellow or Green zones.",
    "- Park & Ride:   Free remote lot with shuttle service. Included with Red/Blue/Gold permits.",
    "- Garage:        Allen Fieldhouse / Central District / Mississippi Street garages have their own permits, plus open hourly rates for visitors (USD 2.25 first hour, USD 2.00 each hour after). Garages are preempted during home athletic events with 48-hour notice.",
  ].join("\n");
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
// Cloud Run entry point
// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const port = Number(Deno.env.get("PORT")) || 8080;

Deno.serve({ port, hostname: "0.0.0.0" }, async (req: Request) => {
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
