# Stop the Bus

<img src=https://user-images.githubusercontent.com/1243909/85988386-38d49680-b9ef-11ea-98b9-7c3dfac62f1b.png width=400 />

Sort of like Stadt Land Fluss, or Scattergories.

Choose some categories and think of a word for each one, with the given letter.

## How to play

1. Visit the [homepage](https://stopthebus.bass.dev) and click ”Create game”.
2. Invite some friends to the game. Share the URL with them, or the game ID to enter on the homepage.
3. Add a nickname, and select some or type in some categories to play with.
4. Click ”Start game”
5. A random letter will be chosen; fill in answers beginning with the letter.
   If you selected ”extra points for alliteration”, answers like “Tina Turner” will score one point for each word beginning with the letter.
6. Finish the round as fast as possible and then vote up or down for answers
7. Have fun

## Rules

1. Do not add movies or books etc that you do not know and cannot describe.
2. Specificity is important. For cities add Washington D.C., not Washington
3. TBD

## Development

You need [pnpm](https://pnpm.io) and a recent Node.

```
git clone https://github.com/alexbassy/stopthebus.git
cd stopthebus
pnpm install
pnpm dev
```

`pnpm dev` runs the Vite dev server together with the Worker and the game Durable Object, locally under workerd, so there is nothing else to start. It needs no environment variables or accounts.

Other commands, all run through Turborepo from the root:

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm test`      | Vitest, in every package                      |
| `pnpm typecheck` | TypeScript, in every package                  |
| `pnpm lint`      | oxlint (`pnpm lint --fix` also sorts imports) |
| `pnpm format`    | oxfmt                                         |
| `pnpm build`     | Production build of the web app and Worker    |

### Layout

- `apps/web`: the React app (Vite, wouter, emotion). Its `wrangler.jsonc` is the Cloudflare config for the whole deployment.
- `apps/worker`: the Hono Worker and the `Game` Durable Object. There is one Durable Object per game, and players talk to it over a single WebSocket. A game's storage is deleted after 24 hours without activity.
- `packages/shared`: the zod schemas, the message protocol and the scoring logic, used by both apps.

Terms such as game, round, stage and stop are defined in [`GLOSSARY.md`](GLOSSARY.md). The reasoning behind using Durable Objects is in [`docs/adr`](docs/adr).

## Deploys

One Worker serves the built web app as static assets, handles `/ws/:gameId` and exports the `Game` Durable Object. It is deployed by [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) when changes are pushed, so there is no GitHub workflow. The build sets `WORKERS_CI_COMMIT_SHA`, which is shown in the page footer.

The production URL is `stopthebus.bass.dev`, with `workers.dev` as a fallback. To deploy by hand:

```
pnpm build
pnpm --filter @stopthebus/web run deploy
```
