import { NavLink } from "react-router-dom";
import { Beaker, Factory, FileText, LayoutDashboard, Package, User, Wrench } from "lucide-react";
import { useAuth } from "@/context/ContextoAutenticacion";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { title: "Panel", url: "/", icon: LayoutDashboard },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Movimientos", url: "/movimientos", icon: Beaker },
  { title: "Informes", url: "/informes", icon: FileText },
  { title: "Mantenimiento", url: "/mantenimiento", icon: Wrench },
];

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function BarraLateralAplicacion() {
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 justify-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Factory className="size-4" />
          </div>
          Inventario Lab
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/perfil"
                  className={({ isActive }) =>
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined
                  }
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {iniciales(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight">
                    <span className="truncate text-sm font-medium">{user.displayName}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                  <User className="ml-auto size-4 text-muted-foreground" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
