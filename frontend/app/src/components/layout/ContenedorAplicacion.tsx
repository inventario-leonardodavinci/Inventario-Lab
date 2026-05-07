import { useLocation } from "react-router-dom"
import { BarraLateralAplicacion } from "./BarraLateralAplicacion"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CentroNotificaciones } from "./CentroNotificaciones"
import { MenuUsuario } from "./MenuUsuario"
import { BotonTema } from "@/components/ui/BotonTema"

const RUTAS: Record<string, string> = {
  "/": "Panel",
  "/articulos": "Artículos",
  "/mantenimiento": "Mantenimiento",
  "/ubicaciones": "Ubicaciones",
  "/categorias": "Categorías",
  "/auditoria": "Auditoría",
  "/usuarios": "Usuarios",
  "/perfil": "Mi perfil",
  "/movimientos": "Movimientos",
}

function useTituloRuta(): string {
  const { pathname } = useLocation()
  const base = "/" + pathname.split("/")[1]
  return RUTAS[base] ?? RUTAS[pathname] ?? "Inventario Lab"
}

export function ContenedorAplicacion({ children }: { children: React.ReactNode }) {
  const titulo = useTituloRuta()

  return (
    <SidebarProvider>
      <BarraLateralAplicacion />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-semibold tracking-tight">
              {titulo}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BotonTema />
            <CentroNotificaciones />
            <div className="h-4 w-px bg-border mx-0.5" />
            <MenuUsuario />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
