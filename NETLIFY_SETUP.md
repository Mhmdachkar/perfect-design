# Netlify Deployment Configuration

## Overview
Perfect Design workshop CRM - TanStack Start + Supabase app configured for Netlify deployment.

## Files Configuration

### 1. `netlify.toml` (Netlify build settings)
```toml
[build]
  command = "npm ci && npm run build"
  publish = "dist/client"

[build.environment]
  NODE_VERSION = "22.12.0"
  NPM_FLAGS = "--no-audit --no-fund"

[dev]
  command = "npm run dev"
  port = 3000
```

### 2. `.node-version` (Node version specification)
```
22
```

### 3. `vite.config.ts` (Vite + Netlify plugin)
```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: false,  // Disabled - using Netlify plugin instead
  plugins: [netlify()],
});
```

### 4. `package.json` - Key sections
```json
{
  "name": "perfect-design",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "build": "vite build"
  },
  "devDependencies": {
    "@netlify/vite-plugin-tanstack-start": "^1.3.16",
    "@vercel/nft": "^0.29.4"
  }
}
```

## Netlify Dashboard Configuration

### Build Settings
Navigate to: **Site settings → Build & deploy → Continuous deployment**

| Setting | Value |
|---------|-------|
| Repository | `Mhmdachkar/perfect-design` |
| Branch | `main` |
| Base directory | *(leave empty)* |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist/client` |
| Node version | Auto-detected from `.node-version` (22) |

### Environment Variables
Add these in: **Site settings → Environment variables**

**Required at BUILD time (VITE_* prefix):**
- `VITE_SUPABASE_URL` = `https://uvnefqpptbnodgpvapqw.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = (your anon key)
- `VITE_SUPABASE_PROJECT_ID` = `uvnefqpptbnodgpvapqw`

**Required at RUNTIME (server-side):**
- `SUPABASE_URL` = `https://uvnefqpptbnodgpvapqw.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = (your anon key)
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key - keep secret!)

## Build Output Structure
```
dist/
├── client/           # Static assets (published to CDN)
│   └── assets/
└── server/          # SSR server code
    └── assets/

.netlify/
└── v1/
    └── functions/
        └── server.mjs  # Netlify Function handler
```

## Troubleshooting

### Build fails with "npm ci" errors
- **Cause**: `package-lock.json` out of sync with `package.json`
- **Fix**: Regenerate lockfile locally:
  ```bash
  rm package-lock.json
  rm -rf node_modules
  npm install
  git add package-lock.json
  git commit -m "Update package-lock.json"
  git push
  ```

### Build shows Nitro preset instead of Netlify plugin
- **Symptom**: Build log shows `[nitro] Building (preset: netlify)` and outputs to `dist/assets/`
- **Fix**: Verify `vite.config.ts` has `nitro: false` and `plugins: [netlify()]`

### Missing environment variables at runtime
- **Symptom**: Supabase client errors in production
- **Fix**: Add ALL variables listed above (both VITE_* and non-VITE versions)

## Deployment Checklist

Before first deploy:
- [ ] Remove `bun.lock` and `bunfig.toml` (forces npm usage)
- [ ] Add `.node-version` file with `22`
- [ ] Update `netlify.toml` with correct build command
- [ ] Install `@netlify/vite-plugin-tanstack-start` package
- [ ] Update `vite.config.ts` to disable Nitro and use Netlify plugin
- [ ] Regenerate `package-lock.json` with `npm install`
- [ ] Configure Netlify dashboard build settings
- [ ] Add all environment variables to Netlify dashboard
- [ ] Push to GitHub and trigger deploy
- [ ] Run `supabase db push` for migrations
- [ ] Disable public sign-up in Supabase Dashboard (production)

## Expected Build Output
Successful build should show:
```
vite v8.1.1 building client environment for production...
✓ built in 3.66s
vite v8.1.1 building ssr environment for production...
[vite] ⬥ Netlify ✓ Wrote SSR entry point to .netlify/v1/functions/server.mjs
✓ built in 2.17s
```

Output structure: `dist/client/assets/` (NOT `dist/assets/`)
