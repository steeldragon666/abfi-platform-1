import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, type PluginOption } from "vite";

export default defineConfig(async ({ command }) => {
  // Only include Manus runtime in serve mode (development), not in build mode (production)
  const isServe = command === 'serve';

  // Conditionally load Manus plugin only in development
  let manusPlugin: PluginOption | undefined;
  if (isServe) {
    try {
      const { vitePluginManusRuntime } = await import("vite-plugin-manus-runtime");
      manusPlugin = vitePluginManusRuntime();
    } catch (e) {
      // Plugin not available, skip
    }
  }

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    // Only include Manus runtime in development to avoid routing interference in production
    ...(manusPlugin ? [manusPlugin] : []),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            "vendor-react": ["react", "react-dom", "wouter"],
            // UI component library
            "vendor-ui": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-aspect-ratio",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-collapsible",
              "@radix-ui/react-context-menu",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-hover-card",
              "@radix-ui/react-label",
              "@radix-ui/react-menubar",
              "@radix-ui/react-navigation-menu",
              "@radix-ui/react-popover",
              "@radix-ui/react-progress",
              "@radix-ui/react-radio-group",
              "@radix-ui/react-scroll-area",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slider",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
              "@radix-ui/react-tabs",
              "@radix-ui/react-toggle",
              "@radix-ui/react-toggle-group",
              "@radix-ui/react-tooltip",
            ],
            // Icons library
            "vendor-icons": ["lucide-react"],
            // Charts and visualization
            "vendor-charts": ["recharts"],
            // Form handling
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            // Data fetching
            "vendor-query": ["@tanstack/react-query", "@trpc/client", "@trpc/react-query"],
            // Date utilities
            "vendor-date": ["date-fns"],
            // Animation
            "vendor-animation": ["framer-motion"],
          },
        },
      },
    },
    server: {
      host: true,
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        // Proxy intelligence API requests to bypass CORS in development
        "/api/v1/sentiment": {
          target: "https://abfi-ai.vercel.app",
          changeOrigin: true,
          secure: true,
        },
        "/api/v1/prices": {
          target: "https://abfi-ai.vercel.app",
          changeOrigin: true,
          secure: true,
        },
        "/api/v1/policy": {
          target: "https://abfi-ai.vercel.app",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
