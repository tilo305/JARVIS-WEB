# n8n + PostgreSQL Setup Guide for Hostinger VPS (Docker)

This guide shows how to activate your Postgres account in n8n and use it as **PostgreSQL Chat Memory** in your AI workflows, when both n8n and PostgreSQL run in Docker on your Hostinger VPS.

---

## Critical: Why "localhost" Fails

**Your current Host: `localhost` will not work** when n8n runs in a Docker container.

Inside a Docker container, `localhost` points to the container itself, not to the host machine or other containers. That leads to "connection refused" errors even when PostgreSQL is running.

Use one of the approaches below depending on your setup.

---

## Architecture Options

### Option A: PostgreSQL in Docker (Recommended for Hostinger VPS)

PostgreSQL and n8n run in the same Docker Compose stack. n8n connects to Postgres via the **service name** `postgres`.

**Host:** `postgres`  
**Database:** `postgres` (or `n8ndb`)  
**User:** `postgres`  
**Password:** Same password as in `.env`/`docker-compose`

### Option B: PostgreSQL on Host (Outside Docker)

PostgreSQL runs on the VPS host; n8n runs in Docker. On Linux (Hostinger VPS), `host.docker.internal` is often not available by default, so you must add it manually or use the host’s IP.

---

## Step-by-Step Setup (Recommended: Option A)

### 1. Ensure PostgreSQL and n8n Are in the Same Docker Stack

Use a `docker-compose.yml` like this:

```yaml
version: '3.8'

volumes:
  db_storage:
  n8n_storage:

services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=postgres
    volumes:
      - db_storage:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -h localhost -U postgres -d postgres']
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=postgres
      - DB_POSTGRESDB_USER=postgres
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - 5678:5678
    volumes:
      - n8n_storage:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
```

Use an `.env` file with `POSTGRES_PASSWORD` set. Store sensitive values securely.

---

### 2. Configure Postgres Credentials in n8n

In n8n → **Settings** → **Credentials** → **Add Credential** → **Postgres**:

| Field | Value |
|-------|-------|
| **Host** | `postgres` *(use the Docker Compose service name, not `localhost`)* |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | Same password as in `.env` |
| **Port** | `5432` |
| **Maximum Number of Connections** | `100` (or leave default) |
| **Ignore SSL Issues** | Off (keep off for internal Docker network) |

Click **Test** to verify the connection.  
If it fails, check that both containers are running and on the same Docker network.

---

### 3. Use Postgres Chat Memory in a Workflow

1. Create a workflow with an **AI Agent** (or similar) node.
2. Add a **Postgres Chat Memory** sub-node to the Agent.
3. In the Postgres Chat Memory node:
   - **Credential:** Select your Postgres credential.
   - **Session Key:** Unique per conversation (e.g. `{{ $json.sessionId }}` or user ID).  
     Different values = different conversation histories.
   - **Table Name:** e.g. `ai_chat_memory` (table is created automatically).
   - **Context Window Length:** e.g. `20` (number of previous messages to load).
4. Connect the workflow so the AI Agent uses this memory.
5. Save and activate the workflow.

---

## If PostgreSQL Is on the Host (Option B)

If Postgres runs directly on the VPS (not in Docker):

1. Ensure Postgres listens on `0.0.0.0` or the Docker bridge IP, not only `127.0.0.1`.
2. In `docker-compose`, add to the n8n service:

```yaml
n8n:
  image: docker.n8n.io/n8nio/n8n
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

Then use **Host:** `host.docker.internal` in the n8n Postgres credential.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| Connection refused | Ensure **Host** is `postgres` (or `host.docker.internal` in Option B), not `localhost` or `127.0.0.1`. |
| Authentication failed | Check user and password match Postgres config; verify `pg_hba.conf` if using host-based auth. |
| Host "postgres" not found | n8n and Postgres must share the same Docker network; use Docker Compose or an explicit network. |
| Session ID issues (e.g. webhook workflows) | Use a stable, unique Session Key (e.g. user ID, webhook session ID); avoid static values for multi-user setups. |

---

## Security

- Do not expose Postgres to the public internet.
- Use strong passwords and keep them in `.env` (not in `docker-compose.yml`).
- For production, consider a dedicated DB user with limited privileges instead of `postgres`.
- SSL is optional for internal Docker-to-Docker traffic; enable it if Postgres is on a different host.

---

## Summary

1. Use **Host: `postgres`** when n8n and Postgres are in the same Docker Compose stack.
2. Never use **Host: `localhost`** when n8n runs in Docker.
3. Add the **Postgres Chat Memory** node to your AI Agent workflow and set a unique **Session Key**.
4. Test the credential in n8n before using it in workflows.
