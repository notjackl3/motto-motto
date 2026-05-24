# Deploying Tidal Wordle

Step-by-step guide to deploy the game. The **backend** (Express + Socket.IO multiplayer server) goes to **Fly.io**. The **frontend** (Vite + React client) goes to **Vercel**. Total time: ~30 min the first time, ~2 min for subsequent updates.

All the deploy config files you need are already in this branch: `Dockerfile`, `.dockerignore`, `fly.toml.example`.

---

## Part A — One-time account setup

### Step 1. Create a Fly.io account

1. Go to https://fly.io/app/sign-up.
2. Sign up with email or GitHub.
3. Add a credit card when prompted. Fly removed their free tier in Oct 2024, but our workload costs **~$0–$3/month** with default settings.
4. (Recommended) Set a spending cap: **Dashboard → Billing → Set spend limit → $5/month**. Safety net against runaway costs.

### Step 2. Create a Vercel account

1. Go to https://vercel.com.
2. Sign in with GitHub (easiest — it lets Vercel auto-deploy when you push).
3. No credit card needed for the free tier; the client is well within it.

### Step 3. Install the Fly CLI

On macOS:
```bash
brew install flyctl
```

On Linux or WSL:
```bash
curl -L https://fly.io/install.sh | sh
```

Verify:
```bash
fly version
```

### Step 4. Log into Fly from the CLI

```bash
fly auth login
```

Opens your browser. After authenticating, the CLI can deploy.

---

## Part B — Deploy the backend (Fly.io)

### Step 5. Get on the right branch

```bash
git clone <repo-url>
cd motto-motto
git checkout 3d-multiplayer
cd tidal-wordle
```

Everything from here runs from inside `tidal-wordle/` unless stated otherwise.

### Step 6. Create your `fly.toml`

```bash
cp fly.toml.example fly.toml
```

Open `fly.toml` in an editor and change **two fields**:

1. **`app`** — must be globally unique on Fly. Suggested format: `tidal-wordle-<yourname>-server`. Example: `tidal-wordle-jane-server`.
2. **`primary_region`** — airport code closest to your players:
   - `sjc` San Jose · `lax` Los Angeles · `sea` Seattle · `ord` Chicago · `iad` Virginia
   - `lhr` London · `fra` Frankfurt · `nrt` Tokyo · `syd` Sydney
   - Full list: https://fly.io/docs/reference/regions/

Save the file. Leave everything else alone.

### Step 7. Create the Fly app

```bash
fly apps create <your-app-name>
```

Use the exact same name you put in `fly.toml`. If Fly says it's taken, pick a different one and update `fly.toml` to match.

### Step 8. Deploy the server

```bash
fly deploy
```

Fly will:
1. Read the `Dockerfile`
2. Build the image remotely (your machine doesn't need Docker installed)
3. Push it to a machine in your chosen region
4. Start it

First deploy takes ~2 minutes. When it finishes, you'll see:
```
Visit your newly deployed app at https://<your-app-name>.fly.dev/
```

### Step 9. Sanity-check the server is alive

```bash
curl https://<your-app-name>.fly.dev/health
```

You should get:
```json
{"ok":true}
```

If you do, the backend is live and WebSocket-ready. **Write down or copy this URL — you'll need it in Step 11.**

---

## Part C — Deploy the frontend (Vercel)

### Step 10. Push your branch to GitHub

If you haven't already:
```bash
git push -u origin 3d-multiplayer
```

Vercel needs the branch to be on GitHub to import it.

### Step 11. Import the project into Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your repo (you may need to grant Vercel access first)
3. Configure these settings — **the root directory is critical**:

   | Field | Value |
   |---|---|
   | **Framework Preset** | Vite (auto-detected) |
   | **Root Directory** | `tidal-wordle/client` ← click "Edit", Vercel defaults to repo root which is wrong |
   | **Build Command** | (leave default — `npm run build`) |
   | **Output Directory** | (leave default — `dist`) |

4. Expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_SERVER_URL` | `https://<your-app-name>.fly.dev` (from Step 9, no trailing slash, no `wss://` prefix) |

5. Click **Deploy**.

Takes ~1 minute. Vercel gives you a URL like `https://tidal-wordle-<random>.vercel.app`. **Copy this URL — you'll need it in Step 12.**

---

## Part D — Connect the two (CORS)

### Step 12. Tell the Fly server about the Vercel URL

The server rejects connections from origins it doesn't trust. Set the `CLIENT_ORIGIN` secret:

```bash
fly secrets set CLIENT_ORIGIN=https://<your-vercel-url>.vercel.app -a <your-app-name>
```

Replace both placeholders with the real values. Fly will redeploy the machine with the new env var — takes ~30 seconds.

### Step 12b. OpenAI manga storyboard (optional)

The pull-out **manga phone** generates panel art via OpenAI **DALL·E 3** on the server. The API key never goes in the client or Vercel — only on Fly:

```bash
fly secrets set OPENAI_API_KEY=sk-... -a <your-app-name>
```

Optional tuning (defaults are fine for most cases):

| Secret | Default | Purpose |
|--------|---------|---------|
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Image model (`dall-e-3` if your account still has it) |
| `OPENAI_IMAGE_SIZE` | `1024x1536` | Vertical manga panel |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low`, `medium`, or `high` for GPT image models |
| `OPENAI_IMAGE_FORMAT` | `png` | `png`, `jpeg`, or `webp` |

**Local dev:** copy the example env file and add your key:

```bash
cd tidal-wordle/server
cp .env.example .env
# Edit .env — set OPENAI_API_KEY=sk-...
npm run dev
```

`.env` is gitignored; never commit it. Production still uses `fly secrets set OPENAI_API_KEY=...`.

If the key is missing, panels fall back to static theme artwork — the game still works.

---

## Part E — Test the deployment

### Step 13. Open the Vercel URL in two browser tabs

Use one normal tab and one **incognito** tab so they're separate socket sessions (otherwise the second tab will share the first tab's connection and join the room as the same player).

### Step 14. Run through a match

1. Both tabs land on the main menu.
2. **Tab A:** click **Multiplayer** → **Create Room** → click the 6-character room code to copy it.
3. **Tab B:** click **Multiplayer** → **Join Room** → paste the code → **Join**.
4. Both tabs should jump to `/multiplayer` and the match begins.
5. Type a guess in either tab. You should see:
   - Your guess appears on your Wordle board with the right colors
   - The same guess (colors only, letters hidden) appears on the **Opponent** panel in the other tab
   - A 3-second cooldown enforced server-side after each guess
6. Close one tab mid-match — the other tab should show an **Opponent disconnected** modal with a 30-second countdown.

### Step 15. Watch the server logs

In a separate terminal:
```bash
fly logs -a <your-app-name>
```

You'll see live events as you play: `[socket] connected`, `[socket] room:create`, `[room ...] match start`, `[room ...] round 1 end`, etc.

---

## Part F — Iterating after first deploy

### Backend changes

```bash
cd tidal-wordle
fly deploy
```

Takes ~30 seconds (cached layers).

### Frontend changes

Vercel **auto-deploys** every push to the branch you imported. Just `git push` and Vercel rebuilds.

Or manually trigger from the CLI:
```bash
npm i -g vercel        # one-time
cd tidal-wordle/client
vercel --prod
```

---

## Things to know

- **Auto-stop machine** — `fly.toml` has `auto_stop_machines = "stop"`. The server suspends after a few minutes of no traffic. The first socket connection after a suspend takes ~1–2 seconds to wake. Fine for playtests; matches stay warm while active. To eliminate cold starts entirely, edit `fly.toml` and change `min_machines_running = 0` to `min_machines_running = 1` (~$2/month always-on).
- **In-memory rooms** — rooms live in process memory. If the Fly machine restarts (deploy, crash, suspend), **active matches are lost**. Acceptable for playtests; not for paying users.
- **Single instance only** — don't scale to 2+ Fly machines without adding the Socket.IO Redis adapter, or players will get routed to servers that don't know about their room.
- **Custom domain** — both Fly and Vercel let you attach `play.yourdomain.com` later. Not needed for v1.

---

## Common gotchas

| Symptom | Fix |
|---|---|
| `fly deploy` errors with "app not found" | You skipped Step 7 — run `fly apps create <name>` first |
| Browser console: `CORS error` on socket | You skipped Step 12 — set the `CLIENT_ORIGIN` secret |
| Browser console: `Failed to connect to wss://` | `VITE_SERVER_URL` in Vercel doesn't match the Fly URL exactly. Check Vercel → Project → Settings → Environment Variables. Redeploy the client after fixing. |
| `fly deploy` takes 5+ minutes building | Normal first time. Subsequent builds reuse cached layers and take ~30s. |
| Vercel build fails: "Cannot find module..." | Root directory is wrong. It should be `tidal-wordle/client`, not the repo root. |
| Server logs show match starts, but clients see nothing | The WebSocket isn't actually upgrading. Open browser devtools → Network → WS tab to confirm a `wss://` connection exists. If it doesn't, `VITE_SERVER_URL` is probably misconfigured. |
| Two tabs in the same browser act like one player | Use one normal tab and one **incognito** — they need separate socket sessions. |

---

## Files you might edit

| Path | When to edit |
|---|---|
| `tidal-wordle/fly.toml` | Change region, scale up, switch to always-on |
| `tidal-wordle/Dockerfile` | Only if dependencies change in a way that breaks the build |
| `tidal-wordle/server/src/words.ts` | Add or change the server-authoritative word list |

That's the whole deploy path. The first run is the fiddliest because of the CORS chicken-and-egg between Fly and Vercel; once both URLs exist and the secret is set, future deploys are one command on each side.
