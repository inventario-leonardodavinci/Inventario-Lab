import { BarraLateralAplicacion } from "./BarraLateralAplicacion"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CentroNotificaciones } from "./CentroNotificaciones"
import { MenuUsuario } from "./MenuUsuario"
import { BotonTema } from "@/components/ui/BotonTema"

export function ContenedorAplicacion({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BarraLateralAplicacion />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="hidden sm:block text-sm font-medium tracking-tight text-muted-foreground">
              Inventario Lab
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <BotonTema />
            <CentroNotificaciones />
            <MenuUsuario />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
