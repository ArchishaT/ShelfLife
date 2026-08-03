// Standard TanStack Start + Vite setup for the ShelfLife web app.
// Explicit plugin list — nothing implicit or hidden.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      // Where the SSR server entry lives — see src/server.ts.
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});

// Note: Nitro's build target defaults to Cloudflare here. If you're deploying
// somewhere else (Vercel, Node, Netlify), set that explicitly — see
// https://tanstack.com/start/latest/docs/framework/react/hosting
