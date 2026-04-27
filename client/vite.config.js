import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  preview: {
    allowedHosts: [".trycloudflare.com", "localhost", "127.0.0.1"]
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
      },
      manifest: {
        name: "AutoHub — мастер",
        short_name: "Мастер",
        description: "Выездной автосервис: заявки мастера, офлайн-кэш списка заказов.",
        theme_color: "#2563eb",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ]
});
