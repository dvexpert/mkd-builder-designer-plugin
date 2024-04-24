import { defineConfig } from 'vite';
import path from 'path'

export default defineConfig({
  build: {
    // Define the output directory
    outDir: './dist',
    // Set to true to create smaller bundles optimized for production
    minify: 'terser',
    // Configure the library mode
    lib: {
      entry: 'main.js', // Main entry file
      name: 'MyJsPlugin',
      formats: ['es', 'umd'], // Output formats: ES module and UMD
      fileName: (format) => `my-js-plugin.${format}.js`
    },
    rollupOptions: {
      // External dependencies to exclude from the bundle
      external: [],
      output: {
        // Global variables to use in UMD format for external imports
        globals: {},
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '/src')
    }
  }
});
