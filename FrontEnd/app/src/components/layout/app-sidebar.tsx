import { Factory, LayoutDashboard, Package, Beaker, FileText } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
  },
  {
    title: "Material Fungible",
    url: "#",
    icon: Package,
  },
  {
    title: "Medios de Cultivo",
    url: "#",
    icon: Beaker,
  },
  {
    title: "Informes de Salida",
    url: "#",
    icon: FileText,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex justify-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Factory className="size-4" />
          </div>
          Lab Inventario
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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
