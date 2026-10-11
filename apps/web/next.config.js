/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Next 15 needs the TS6 compiler API (devDependency here); TS7 type-checks via `pnpm typecheck`, run before `next build`.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}
