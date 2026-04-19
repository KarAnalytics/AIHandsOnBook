# KU Parking MCP Server on Supabase Edge Functions

This is the **cloud-hosted** version of the KU Parking MCP server. Unlike the local Python version (`../ku_parking_mcp.py`) which runs on your laptop, this version lives at a **public HTTPS URL** on Supabase's infrastructure. Any MCP client anywhere can call it over the internet.

## Architecture

```
[Dify workflow]    [Python notebook]    [Claude Desktop]    [Web app]
       \                  |                    |                 /
        \                 |                    |                /
         `----------> HTTPS (MCP JSON-RPC over HTTP) <---------'
                                  |
                                  v
                    Supabase Edge Function (Deno)
                                  |
                                  v
                    Parking + buildings data
                    (hardcoded in index.ts for now;
                    future: pull from Postgres table)
```

Everything is stateless, everything is public (or protected by JWT if you prefer), and every client uses the same tool names and schema.

## What's in this folder

```
supabase/
  functions/
    ku-parking/
      index.ts      <- the Edge Function code (Deno + TypeScript)
```

You can drop this folder into any Supabase project and deploy it as-is.

## Prerequisites

1. A **Supabase account** — sign up at [supabase.com](https://supabase.com) (free tier is plenty)
2. A **Supabase project** — click "New Project" after signing in. Remember its **project ref** (the string in the URL like `abcdefghijklmn`)
3. The **Supabase CLI** — install it locally:
   - macOS: `brew install supabase/tap/supabase`
   - Windows: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
   - All platforms: `npm install -g supabase`
   - Full docs: <https://supabase.com/docs/guides/cli>
4. **Docker** is NOT required for deployment (only for local dev)

## Deploy in 5 commands

From the directory containing this README (`Agentic/mcp/supabase/`):

```bash
# 1. Log in to Supabase (opens a browser)
supabase login

# 2. Link this folder to your Supabase project
supabase link --project-ref <your-project-ref>

# 3. Deploy the function
#    --no-verify-jwt makes it publicly accessible (no auth needed)
#    Remove that flag if you want Supabase Auth JWT required
supabase functions deploy ku-parking --no-verify-jwt

# 4. Note the URL from the output:
#    https://<your-project-ref>.supabase.co/functions/v1/ku-parking

# 5. Test it with curl
curl https://<your-project-ref>.supabase.co/functions/v1/ku-parking
```

The `GET` request returns a discovery response listing the available tools. For real MCP calls you'll POST JSON-RPC requests (see below).

## The three tools exposed

| Tool name | Purpose |
|---|---|
| `list_ku_buildings` | Returns all KU building names available for parking lookup |
| `find_parking_near_building` | Given a building name, radius (miles), and top-K, returns ranked nearest parking lots with colors, distances, walk times, and Google Maps pins |
| `get_parking_colors_legend` | Returns the KU parking permit color legend |

## Testing the deployed function

### Option 1 — Discovery (health check)

```bash
curl https://<ref>.supabase.co/functions/v1/ku-parking
```

Returns a JSON payload with the server name, version, and tool names.

### Option 2 — List tools (MCP `tools/list`)

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/ku-parking \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

Returns the full tool schemas that an MCP client would use to render function definitions for an LLM.

### Option 3 — Call a tool (MCP `tools/call`)

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/ku-parking \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "find_parking_near_building",
      "arguments": {
        "building_name": "business school",
        "max_distance_miles": 2.0,
        "top_k": 5
      }
    }
  }'
```

Returns the ranked parking list as a text content item.

## Calling the server from Python (for Colab notebooks)

Since this is an HTTP endpoint, you don't need the MCP Python SDK — you can hit it with plain `requests`:

```python
import requests

BASE_URL = "https://<your-ref>.supabase.co/functions/v1/ku-parking"

def mcp_call(method, params=None, id=1):
    response = requests.post(BASE_URL, json={
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params or {},
    })
    return response.json()

# List available tools
tools = mcp_call("tools/list")
for t in tools["result"]["tools"]:
    print(t["name"], "—", t["description"][:80])

# Call find_parking_near_building
result = mcp_call("tools/call", {
    "name": "find_parking_near_building",
    "arguments": {"building_name": "business school", "max_distance_miles": 2.0, "top_k": 5},
})
print(result["result"]["content"][0]["text"])
```

If you prefer the official `mcp` Python SDK (which supports Streamable HTTP transport), the pattern is:

```python
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async with streamablehttp_client(BASE_URL) as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()
        result = await session.call_tool(
            "find_parking_near_building",
            {"building_name": "business school", "max_distance_miles": 2.0},
        )
        print(result.content[0].text)
```

## Using from Dify (workflow builder)

Dify supports calling external HTTP endpoints via its **HTTP Request node**. Drop the Supabase URL in as a standard HTTP POST with the JSON-RPC body. Dify can then use the response inside a workflow — no MCP-specific plugin required.

Even better, Dify has an **MCP tool plugin** in its marketplace. Add the plugin, paste your Supabase function URL as the MCP server URL, and the three tools automatically appear as native Dify tool nodes you can drag into any workflow.

## Using from Claude Desktop

Claude Desktop's local `claude_desktop_config.json` doesn't support remote HTTP MCP servers yet (it spawns local subprocesses via stdio). To bridge to a remote Supabase function, use a tiny local proxy like `npx @modelcontextprotocol/server-proxy` or run the local Python server from `../ku_parking_mcp.py` instead.

## Security notes

- The `--no-verify-jwt` flag makes the function publicly accessible. For a classroom demo that's fine; the data is public.
- For production, **remove that flag** and have clients send a Supabase JWT in the `Authorization: Bearer <jwt>` header. The Edge Function will reject unauthenticated requests.
- You can also add your own API key check in the Edge Function — read the `Authorization` header manually and compare to a secret stored in `supabase secrets set`.

## Evolving to a real database

The current version hardcodes the data in `index.ts`. A more production-like setup would:

1. Create two Postgres tables in your Supabase project:
   ```sql
   create table ku_buildings (
     name text primary key,
     lat  double precision not null,
     lng  double precision not null
   );
   create table ku_parking_lots (
     lot   text primary key,
     color text not null,
     lat   double precision not null,
     lng   double precision not null
   );
   ```
2. Insert the same rows from `index.ts` using the Supabase Table Editor
3. In the Edge Function, query the tables with the Supabase client:
   ```typescript
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
   const supabase = createClient(
     Deno.env.get("SUPABASE_URL")!,
     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
   );
   const { data: buildings } = await supabase.from("ku_buildings").select();
   ```
4. Now the data can be updated via the Supabase dashboard or SQL — no redeploy needed

That's the production path. For a teaching demo, hardcoded data is fine and keeps the Edge Function self-contained.

## Teaching angle — local vs. cloud MCP

This folder and `../ku_parking_mcp.py` together make a great contrast for students:

| | Local Python MCP | Supabase Edge MCP |
|---|---|---|
| Language | Python | TypeScript (Deno) |
| Transport | stdio (local subprocess) | HTTP (public URL) |
| Runs where? | Student's laptop | Supabase's cloud |
| Who can call it? | Only local clients | Anyone on the internet |
| Cold start | Instant (Python already running) | ~200-500ms per request |
| Scales to many clients? | No (single subprocess) | Yes (Supabase autoscales) |
| Best for | Local dev, Claude Desktop | Real apps, multi-client, Dify |

Both servers expose the **same three tools with the same names**, so a client can switch between local and cloud versions just by changing the connection URL. That's the whole point of a standard protocol like MCP.
