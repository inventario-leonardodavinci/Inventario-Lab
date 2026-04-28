import { BarraLateralAplicacion } from "./BarraLateralAplicacion"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/ContextoAutenticacion"
import { CentroNotificaciones } from "./CentroNotificaciones"

export function ContenedorAplicacion({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <SidebarProvider>
      <BarraLateralAplicacion />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-medium tracking-tight">
            Inventario Laboratorio Salud Ambiental
          </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && <p className="text-xs text-muted-foreground">{user.displayName}</p>}
            <CentroNotificaciones />
            {user && (
              <Button variant="outline" size="sm" onClick={logout}>
                Salir
              </Button>
            )}
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
