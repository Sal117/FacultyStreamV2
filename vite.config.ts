// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Required for aliasing

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // buffer: 'buffer', // Comment out
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // global: {}, // Comment out
  },
  
  server: {
    hmr: {
      overlay: false, // Disable HMR overlay for errors
    },
  },
  build: {
    rollupOptions: {
      output: {
        globals: {
          // buffer: 'Buffer', // Comment out
        },
      },
    },
  },
});

// TypeScript interfaces remain unchanged
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string; // Example of an environment variable
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
