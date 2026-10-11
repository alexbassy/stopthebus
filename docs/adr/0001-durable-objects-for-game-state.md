# Durable Objects for game state

Fauna shut down, so game state moves to one Cloudflare Durable Object per game, reached over a single WebSocket. Every mutation is a zod-validated message, and the Worker also serves the static Vite build. We chose this over REST plus a separate database because a game is a small, single-writer, realtime room: the DO gives ordering, push and storage in one place. The cost is lock-in to Cloudflare and a WebSocket-only API.
