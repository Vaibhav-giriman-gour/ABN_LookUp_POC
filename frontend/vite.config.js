import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// REMOVE: import tailwindcss from 'tailwindcss'; // No longer needed directly here
import autoprefixer from 'autoprefixer'; // Keep autoprefixer

// ADD: Import the new PostCSS plugin
import tailwindcssPlugin from '@tailwindcss/postcss'; // <<< NEW IMPORT

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Use the NEW imported Tailwind CSS plugin here
        tailwindcssPlugin(), // <<< USE THE NEW PLUGIN HERE (call it as a function)
        autoprefixer,
      ],
    },
  },
});