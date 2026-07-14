import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { SessionTimeoutModal } from "@/components/SessionTimeoutModal"
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout"
import { NotificationProvider } from "@/auth/NotificationProvider"
import { ArchivistLiveAlerts } from "@/components/ArchivistLiveAlerts"
import { ReceptionCallAlerts } from "@/components/ReceptionCallAlerts"
import { RequireSubscriptionRenewal } from "@/auth/RequireSubscriptionRenewal"
import { SubscriptionProvider } from "@/auth/SubscriptionProvider"

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { showWarning, countdown, stayLoggedIn } = useInactivityTimeout(30 * 60 * 1000)

  return (
    <NotificationProvider>
      <ArchivistLiveAlerts />
      <ReceptionCallAlerts />
      <SubscriptionProvider>
      <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <RequireSubscriptionRenewal>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          </RequireSubscriptionRenewal>
        </main>
      </div>

      {showWarning && <SessionTimeoutModal countdown={countdown} onStayLoggedIn={stayLoggedIn} />}
      </div>
      </SubscriptionProvider>
    </NotificationProvider>
  )
}
