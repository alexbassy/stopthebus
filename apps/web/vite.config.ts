import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: { tsconfigPaths: true },
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(
      process.env.WORKERS_CI_COMMIT_SHA?.slice(0, 7) ?? 'local',
    ),
  },
})
