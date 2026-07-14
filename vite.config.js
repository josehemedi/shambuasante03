import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import basicSsl from "@vitejs/plugin-basic-ssl"
import path from "path"
import os from "os"

function getLanAddresses() {
  const nets = os.networkInterfaces()
  const addresses = []
  for (const iface of Object.values(nets)) {
    for (const net of iface || []) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address)
      }
    }
  }
  return addresses
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const useHttps = env.VITE_DEV_HTTPS === "true"
  const isMobileMode = mode === "mobile"
  const port = isMobileMode ? 5174 : 5173
  const protocol = useHttps ? "https" : "http"

  return {
    plugins: [useHttps ? basicSsl() : null, react(), tailwindcss()].filter(Boolean),
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["xlsx-js-style", "sockjs-client"],
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      port,
      strictPort: true,
      cors: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8082",
          changeOrigin: true,
          secure: false,
        },
        "/ws": {
          target: "http://127.0.0.1:8082",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const lan = getLanAddresses()
        console.log("")
        console.log("  Shambua Santé — URLs de connexion")
        if (isMobileMode) {
          console.log(`  Mobile (caméra/micro)  → ${protocol}://localhost:${port}/`)
          lan.forEach((ip) => console.log(`  Mobile (même Wi‑Fi)   → ${protocol}://${ip}:${port}/`))
          console.log("  ⚠ Accepter l'avertissement certificat sur le téléphone")
        } else {
          console.log(`  PC (connexion/login)   → ${protocol}://localhost:${port}/`)
          console.log(`  Mobile HTTPS           → lancer aussi: npm run dev:mobile (port 5174)`)
        }
        console.log("")
      })
    },
  }
})
