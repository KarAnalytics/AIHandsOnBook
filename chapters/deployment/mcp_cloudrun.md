# MCP Servers on Google Cloud Run

Deploying tools as a cloud-hosted MCP server gives every client (notebooks, web apps, Dify, Claude Desktop) access to the same tools via a standard HTTPS interface.

This section walks through deploying the KU Parking MCP server to Google Cloud Run and calling it from Python and Dify.

The deployment guide and full source live in this repo under `infra/ku-parking-mcp/`. The TypeScript server is at `infra/ku-parking-mcp/cloudrun/index.ts`, and the container build is defined in the sibling `Dockerfile`. To deploy:

```bash
cd infra/ku-parking-mcp/cloudrun
gcloud run deploy ku-parking-mcp --source . --region us-central1 --allow-unauthenticated --min-instances 0 --max-instances 10
```

Cloud Build packages the folder into a container, pushes it to Artifact Registry, and Cloud Run starts serving it at a public HTTPS URL. No local Docker required — `--source .` hands the build off to Google's infrastructure.
