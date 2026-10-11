# 03: Vite shell deployed to Cloudflare

**What to build:** Next is removed and the web app becomes Vite, React and wouter, built by the Cloudflare Vite plugin into one Worker with Static Assets. The home page, acknowledgements page and an empty game route render, with themes, sounds and emotion styling intact. It deploys through Workers Builds and is served at `stopthebus.bass.dev`, with `workers.dev` as the fallback while DNS is set up.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `pnpm dev` runs the site with hot reload
- [ ] Deep links such as `/game/abc` load through the SPA fallback
- [ ] Page titles come from React's built-in head support, not `next/head`
- [ ] A push to main deploys, and the site loads on `stopthebus.bass.dev`
- [ ] No Next dependency remains
