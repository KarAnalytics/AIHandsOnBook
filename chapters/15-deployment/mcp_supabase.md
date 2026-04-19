# MCP Servers on Supabase

Deploying tools as a cloud-hosted MCP server gives every client (notebooks, web apps, Dify, Claude Desktop) access to the same tools via a standard HTTPS interface.

This section walks through deploying the KU Parking MCP server to Supabase Edge Functions and calling it from Python and Dify.

The deployment guide and full source live in this repo under `infra/ku-parking-mcp/`. The TypeScript edge function is at `infra/ku-parking-mcp/supabase/functions/ku-parking/index.ts`. To deploy:

```bash
cd infra/ku-parking-mcp
supabase functions deploy ku-parking --no-verify-jwt
```
