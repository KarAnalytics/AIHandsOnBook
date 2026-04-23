# KU Parking MCP Server on Google Cloud Run

This is the **Cloud Run** version of the KU Parking MCP server. It serves the
same three tools (`list_ku_buildings`, `find_parking_near_building`,
`get_parking_colors_legend`) at a public HTTPS URL, but runs as a container on
Google Cloud Run instead of a Supabase Edge Function.

## Why Cloud Run instead of Supabase?

Supabase's free tier **pauses** a project after 7 days of inactivity, and the
owner has to click a button in the dashboard to wake it back up. That is fine
for a private side project, but for a textbook MCP endpoint that any reader or
student might hit at any time, it is a reliability problem.

Cloud Run's free tier is different:

| | Supabase Edge Free | Cloud Run Free |
|---|---|---|
| Forced pause on inactivity | Yes -- every 7 days, manual resume | No |
| Cold start after idle | ~300 ms | 1-5 s |
| Monthly free tier | 500k invocations | 2M requests + 360k vCPU-seconds |
| Container tech? | No (Deno runtime managed) | Yes (you ship a Dockerfile) |
| Billing risk | None (hard cap) | Soft cap -- set a budget alert! |

The tradeoff: Cloud Run cold starts are a bit slower and you should set a
billing budget. The reliability win is worth it for this use case.

## Architecture

```
[Dify workflow]    [Python notebook]    [Claude Desktop]    [Web app]
       \                  |                    |                 /
        \                 |                    |                /
         `----------> HTTPS (MCP JSON-RPC over HTTP) <---------'
                                  |
                                  v
               Google Cloud Run container (Deno 2.x)
                                  |
                                  v
                    Parking + buildings data
                    (hardcoded in index.ts for now)
```

Stateless, public (or IAM-protected if you prefer), scales to zero when idle.

## What's in this folder

```
cloudrun/
  index.ts       <- the MCP server (Deno + TypeScript, identical logic to the
                    Supabase version; only the bootstrap line differs)
  Dockerfile     <- denoland/deno:2.1.4 base, copies index.ts, runs it
  .dockerignore  <- keeps the build context minimal
  README.md      <- this file
```

## Prerequisites

1. A **Google Cloud project** with billing enabled. The free tier covers
   expected classroom usage, but a billing account must be attached.
2. The **gcloud CLI** installed locally. Check with `gcloud --version`.
   Install from <https://cloud.google.com/sdk/docs/install>.
3. Three APIs enabled on the project (one-time):
   ```bash
   gcloud services enable \
       run.googleapis.com \
       cloudbuild.googleapis.com \
       artifactregistry.googleapis.com
   ```
4. Set the active project so you do not have to pass `--project` every time:
   ```bash
   gcloud config set project <your-project-id>
   ```

Docker is **not** required locally. `gcloud run deploy --source .` hands the
folder to Cloud Build, which builds the container in GCP.

## Deploy in one command

From this directory (`infra/ku-parking-mcp/cloudrun/`):

```bash
gcloud run deploy ku-parking-mcp \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10
```

First run takes 2-3 minutes (Cloud Build has to pull the Deno image and build
the container). Subsequent deploys are ~30 seconds because layers are cached.

When it finishes, the CLI prints the public URL, e.g.:

```
Service URL: https://ku-parking-mcp-abcdefghij-uc.a.run.app
```

That URL is stable across redeploys -- it only depends on the service name and
region.

### What each flag does

| Flag | Why |
|---|---|
| `--source .` | Build from the current folder using Cloud Build (no local Docker needed) |
| `--region us-central1` | Cheapest region with full free-tier eligibility |
| `--allow-unauthenticated` | Makes the URL public (no Google Cloud IAM required to call it). Equivalent to Supabase's `--no-verify-jwt` |
| `--min-instances 0` | Scale to zero when idle. Stays within the free tier |
| `--max-instances 10` | Cap concurrency so a runaway loop cannot produce a huge bill |

## Testing the deployed server

### Health check / discovery

```bash
curl https://<your-service-url>/
```

Returns a JSON payload listing the tool names.

### List MCP tools

```bash
curl -X POST https://<your-service-url>/ \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Call a tool

```bash
curl -X POST https://<your-service-url>/ \
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

## Calling it from Python (same as the Supabase version)

```python
import requests

BASE_URL = "https://ku-parking-mcp-<hash>-uc.a.run.app"

def mcp_call(method, params=None, id=1):
    response = requests.post(BASE_URL, json={
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params or {},
    })
    return response.json()

tools = mcp_call("tools/list")
for t in tools["result"]["tools"]:
    print(t["name"], "-", t["description"][:80])
```

Because the MCP JSON-RPC body is identical, client code only changes the URL
when switching between Supabase and Cloud Run.

## Keeping costs at zero

Set a billing budget so a runaway loop cannot surprise you:

1. Go to Billing -> Budgets & alerts in the Cloud Console
2. Create a budget of e.g. $1/month on this project
3. Add alert thresholds at 50%, 90%, 100%

With `min-instances 0` and `max-instances 10`, classroom-scale usage is
comfortably inside the always-free tier (2M requests/month,
360k vCPU-seconds/month). A $1 budget alert just gives you an early warning if
something goes wrong.

## Updating the data

The data is hardcoded in `index.ts`. To update buildings or lots:

1. Edit the arrays near the top of `index.ts`
2. Re-run the deploy command -- Cloud Build caches the Deno layer, so the
   rebuild is ~30 seconds
3. Verify with the curl health check

## Teaching angle -- local, Supabase, and Cloud Run

This folder pairs with `../supabase/` to give students three MCP server
deployment styles:

| | Local Python | Supabase Edge | Cloud Run |
|---|---|---|---|
| Runtime | Python on laptop | Deno (managed) | Deno in a container |
| Transport | stdio | HTTPS | HTTPS |
| Where it lives | Student laptop | Supabase cloud | Google Cloud |
| Packaging | Python source | TypeScript source | Dockerfile + source |
| Cold start | Instant | ~300 ms | 1-5 s |
| Idle behavior | Always on | Paused after 7 days | Scales to zero |
| Ideal client | Claude Desktop | Quick demo | Production / classroom |

Same three tools, same JSON-RPC protocol -- only the URL and deployment story
differ. That is the MCP lesson: clients do not care how the server is hosted.
