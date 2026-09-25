import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from a subpath (/Blueprint/); local dev and
// self-hosted builds serve from the root. The deploy workflow sets the env var;
// everything else stays at '/'.
export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/Blueprint/' : '/',
}));
