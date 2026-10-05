import { defineConfig } from 'vite';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const api = { '/api': API_URL };

// `npm run dev` also runs the backend API (with restart-on-change), unless API_URL points at one already running.
function backendDevServer() {
  return {
    name: 'backend-dev-server',
    apply: 'serve',
    configureServer(server) {
      if (process.env.API_URL) return;
      const backend = spawn(process.execPath, ['--watch', 'server.js'], {
        cwd: fileURLToPath(new URL('../backend', import.meta.url)),
        stdio: 'inherit',
      });
      server.httpServer?.once('close', () => backend.kill());
      process.once('exit', () => backend.kill());
    },
  };
}

export default defineConfig({
  plugins: [backendDevServer()],
  server: { proxy: api },
  preview: { proxy: api },
});
