import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
})()

// https://vite.dev/config/
export default defineConfig({
  base: '/meshtrack-studio/',
  build: {
    outDir: 'docs',
    emptyOutDir: false,
    manifest: false,
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __REPOSITORY_URL__: JSON.stringify('https://github.com/baditaflorin/meshtrack-studio'),
    __PAYPAL_URL__: JSON.stringify('https://www.paypal.com/paypalme/florinbadita'),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
