import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Required for aliasing

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer', // Polyfill for Buffer
    },
  },
  define: {
    global: {}, // Define global to fix polyfill issues
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
          buffer: 'Buffer', // Use Buffer as a global
        },
      },
    },
  },
});

// Adding TypeScript interfaces for environment variables
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string; // Example of an environment variable
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}