import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: { tsconfigPaths: true },
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(
      process.env.WORKERS_CI_COMMIT_SHA?.slice(0, 7) ?? 'local',
    ),
  },
})
