import { useLocation } from "react-router-dom"
import { BarraLateralAplicacion } from "./BarraLateralAplicacion"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MenuUsuario } from "./MenuUsuario"
import { BotonTema } from "@/components/ui/BotonTema"
import { Separator } from "@/components/ui/separator"

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
      <SidebarInset className="flex flex-col min-h-svh min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="h-6 shrink-0" />
            <span className="text-sm font-semibold tracking-tight truncate">
              {titulo}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <BotonTema />
            <Separator orientation="vertical" className="h-6" />
            <MenuUsuario />
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
