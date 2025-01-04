// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Required for aliasing

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: './index.html',
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    
    port: 5173,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    open: true,
    
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
});

// TypeScript interfaces remain unchanged
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string; // Example of an environment variable
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
