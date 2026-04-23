# Deno runtime for the KU Parking MCP server on Cloud Run.
# Uses the official Deno image -- no Node/npm involved.
FROM denoland/deno:2.1.4

WORKDIR /app

# Copy only the source file. The server has zero external imports, so there
# is no lockfile or deps.ts to worry about.
COPY index.ts .

# Pre-cache the module so the first request does not pay the parse cost.
# (For a single self-contained file this is near-instant, but it keeps the
# image layer stable for faster subsequent builds.)
RUN deno cache index.ts

# Cloud Run sends traffic to $PORT (default 8080). The app reads PORT itself;
# we set it here so local `docker run` works too.
ENV PORT=8080
EXPOSE 8080

# --allow-net : bind the HTTP port
# --allow-env : read the PORT env var
# No file-system or run-subprocess perms needed.
CMD ["run", "--allow-net", "--allow-env", "index.ts"]
