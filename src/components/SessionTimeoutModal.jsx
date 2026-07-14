import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui/primitives"
import { AnimatedModal } from "@/components/ui/AnimatedModal"

export function SessionTimeoutModal({ countdown, onStayLoggedIn }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onStayLoggedIn()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onStayLoggedIn])

  return (
    <AnimatedModal open zIndex={100} onClose={onStayLoggedIn} contentClassName="max-w-md">
      <Card className="border-destructive/30">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
            <Clock className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4">Session expirée</CardTitle>
          <CardDescription>
            Votre session va expirer dans{" "}
            <span className="font-semibold text-foreground">{countdown}</span> secondes pour des raisons de sécurité.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={onStayLoggedIn} className="w-full">
            Rester connecté
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/login", { replace: true })}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </AnimatedModal>
  )
}
