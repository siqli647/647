
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Cast process to any to fix TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in your App.tsx even after build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // CRITICAL FIX: Polyfill process.env object to prevent "Uncaught ReferenceError: process is not defined"
      // which causes white screen in production builds
      'process.env': {},
    },
  }
})
