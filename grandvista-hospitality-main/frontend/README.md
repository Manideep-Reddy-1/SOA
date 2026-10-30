# GrandVista frontend

## Run locally

From this directory, install dependencies and start Vite:

```powershell
npm install
npm run dev
```

The local development build uses `http://localhost:8080` for the API gateway.
To start the complete local stack, open the repository in VS Code and run
**Terminal > Run Task > Start GrandVista Hospitality**, or run
`.\start-grandvista.ps1` from the repository root. The task opens separate
terminal windows for each service; run it again after those services have
stopped.

## Deploy to Netlify

Configure the Netlify site with:

- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_BASE_URL` set to the public HTTPS URL of
  the deployed API gateway (for example, `https://api.example.com`)

The API gateway and its services must be deployed and reachable from browsers.
Do not set `VITE_API_BASE_URL` to `localhost` for a hosted site: in a visitor's
browser that address points to the visitor's own computer. The gateway must
also allow the Netlify site origin in its CORS configuration. Redeploy the
frontend after changing the environment variable because Vite embeds it in the
production build.

The `public/_redirects` rule rewrites direct navigation and refreshes of
client-side routes (such as `/login`) to the React application.
