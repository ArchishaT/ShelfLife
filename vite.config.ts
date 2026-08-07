import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

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
      server: {
        entry: "server",
      },
    }),

    nitro({
      preset: "vercel",
    }),

    viteReact(),
  ],
});
// Note: The Nitro build target is set to Vercel for deployment. If you're
// deploying somewhere else (Cloudflare, Node, Netlify), change the preset
// accordingly — see
// https://tanstack.com/start/latest/docs/framework/react/hosting
