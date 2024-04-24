import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        outDir: "./dist",
        assetsDir: "assets",
        minify: "terser",
        lib: {
            entry: "main.js", // Main entry file
            name: "MyJsPlugin",
            formats: ["es", "umd"], // Output formats: ES module and UMD
            fileName: (format) => `mkd-plugin.${format}.js`,
        },
        rollupOptions: {
            // External dependencies to exclude from the bundle
            external: [],
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith(".css")) {
                        return "assets/css/[name][extname]";
                    } else {
                        return "[name][extname]";
                    }
                },
                // Global variables to use in UMD format for external imports
                globals: {},
            },
        },
        cssCodeSplit: false,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "/src"),
        },
    },
});
