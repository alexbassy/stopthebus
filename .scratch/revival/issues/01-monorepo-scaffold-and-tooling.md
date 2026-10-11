# 01: Monorepo scaffold and tooling

**What to build:** The repo becomes a pnpm workspace with Turborepo and three packages: a web app, a worker and a shared package. The existing code moves in unchanged. Yarn, ESLint, Prettier and Jest are replaced by oxlint, oxfmt, TypeScript 7 and Vitest. Dependencies are bumped to current wherever that doesn't need the later rewrites.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `pnpm install`, `pnpm build`, `pnpm lint` and `pnpm test` run from the root through Turborepo
- [x] The existing scoring test passes under Vitest
- [x] `yarn.lock`, the ESLint config, the Prettier config and the Jest config are gone
- [x] If Next fails to type-check under TypeScript 7, the fallback (a `tsc --noEmit` step) is noted in the ticket

## Notes

- Layout: `apps/web`, `apps/worker`, `packages/shared` (empty placeholder). The worker still imports web `src` via the `@/*` path alias (`../web/src`), until ticket 02 moves shared code.
- **TS7 fallback:** Next 15 can't load the TS7 compiler API ("TypeScript 7 is not supported by this version of Next.js"; Next >= 16.2.11 supports it but needs React 19). So `apps/web` keeps `typescript@^6` as a devDependency for Next, and its `typecheck`/`build` run the root TS7 `tsc --noEmit` first. Next's own check is `ignoreBuildErrors`.
- Held back to avoid rewrites: React 18, `@types/react` 17 (implicit `children`), Next 15, nanoid 3, framer-motion (bumped to 12 in package.json but untested visually).
- worktop's exports map has no types, so the worker tsconfig maps `worktop` to its `.d.ts`.
- Worker build is still esbuild (service-worker format). `servertime` was replaced by `lib/timer.ts` because its `on-headers` dep needs Node `http`. Deploy under Wrangler 4 only dry-run verified; CI moved to wrangler-action@v3.
- `next build` needs `NEXT_PUBLIC_FAUNA_KEY` (pre-existing); set it in `apps/web/.env.local`.
- `pnpm lint` passes with 34 oxlint warnings, 0 errors.
