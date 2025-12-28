import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig(async ({ command }) => {
  // Only include Manus runtime in serve mode (development), not in build mode (production)
  const isServe = command === 'serve';

  // Manus plugin disabled for local testing
  let manusPlugin: PluginOption | undefined = undefined;
  // if (isServe) {
  //   try {
  //     const { vitePluginManusRuntime } = await import("vite-plugin-manus-runtime");
  //     manusPlugin = vitePluginManusRuntime();
  //   } catch (e) {
  //     // Plugin not available, skip
  //   }
  // }

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    // Only include Manus runtime in development to avoid routing interference in production
    ...(manusPlugin ? [manusPlugin] : []),
    // Bundle analyzer - generates HTML report when ANALYZE=true
    ...(isAnalyze ? [visualizer({
      filename: "report/bundle-stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: "treemap", // treemap, sunburst, or network
    }) as PluginOption] : []),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(__dirname),
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      // Temporarily raised while optimizing chunk sizes
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React - loaded on every page
            if (id.includes("node_modules/react/") ||
                id.includes("node_modules/react-dom/") ||
                id.includes("node_modules/wouter/") ||
                id.includes("node_modules/scheduler/")) {
              return "vendor-react";
            }

            // Split Radix UI into functional groups for better code splitting
            // Overlay components - dialogs, popovers, dropdowns (load on interaction)
            if (id.includes("@radix-ui/react-dialog") ||
                id.includes("@radix-ui/react-popover") ||
                id.includes("@radix-ui/react-dropdown-menu") ||
                id.includes("@radix-ui/react-tooltip") ||
                id.includes("@radix-ui/react-hover-card") ||
                id.includes("@radix-ui/react-context-menu") ||
                id.includes("@radix-ui/react-alert-dialog")) {
              return "vendor-ui-overlay";
            }

            // Form components - inputs, selects, toggles
            if (id.includes("@radix-ui/react-checkbox") ||
                id.includes("@radix-ui/react-radio-group") ||
                id.includes("@radix-ui/react-select") ||
                id.includes("@radix-ui/react-switch") ||
                id.includes("@radix-ui/react-slider") ||
                id.includes("@radix-ui/react-toggle") ||
                id.includes("@radix-ui/react-toggle-group") ||
                id.includes("@radix-ui/react-label")) {
              return "vendor-ui-form";
            }

            // Layout components - accordions, tabs, navigation
            if (id.includes("@radix-ui/react-accordion") ||
                id.includes("@radix-ui/react-tabs") ||
                id.includes("@radix-ui/react-collapsible") ||
                id.includes("@radix-ui/react-scroll-area") ||
                id.includes("@radix-ui/react-separator") ||
                id.includes("@radix-ui/react-aspect-ratio") ||
                id.includes("@radix-ui/react-navigation-menu") ||
                id.includes("@radix-ui/react-menubar")) {
              return "vendor-ui-layout";
            }

            // Core Radix primitives (slot, avatar, progress) - small, frequently used
            if (id.includes("@radix-ui/react-")) {
              return "vendor-ui-core";
            }

            // Icons - lucide-react
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            // D3 utilities - foundation for recharts (split from recharts)
            if (id.includes("d3-")) {
              return "vendor-d3";
            }

            // Recharts - charting library (depends on d3)
            if (id.includes("recharts")) {
              return "vendor-recharts";
            }

            // Forms - react-hook-form, zod validation
            if (id.includes("react-hook-form") ||
                id.includes("@hookform/") ||
                id.includes("node_modules/zod/")) {
              return "vendor-forms";
            }

            // Data fetching - tanstack query, trpc
            if (id.includes("@tanstack/react-query") ||
                id.includes("@trpc/")) {
              return "vendor-query";
            }

            // Animation - framer-motion (heavy, defer loading)
            if (id.includes("framer-motion") || id.includes("popmotion")) {
              return "vendor-animation";
            }

            // Maps - leaflet (only load on map pages)
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "vendor-maps";
            }

            // PDF generation (only load when needed)
            if (id.includes("@react-pdf") || id.includes("pdfkit") || id.includes("jspdf")) {
              return "vendor-pdf";
            }

            // Blockchain/crypto (only load when needed)
            if (id.includes("ethers") || id.includes("@noble/")) {
              return "vendor-crypto";
            }

            // Date utilities
            if (id.includes("date-fns")) {
              return "vendor-date";
            }

            // Supabase client
            if (id.includes("@supabase/")) {
              return "vendor-supabase";
            }
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
