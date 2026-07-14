import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "@/theme/ThemeProvider"
import { I18nProvider } from "@/i18n/I18nProvider"
import { AuthProvider } from "@/auth/AuthProvider"
import { TenantBrandingProvider } from "@/auth/TenantBrandingProvider"
import App from "@/App"
import "@/index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <TenantBrandingProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </TenantBrandingProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
