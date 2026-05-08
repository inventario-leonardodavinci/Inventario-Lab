import { NavLink, useLocation } from 'react-router-dom'
import { FolderOpen, LayoutDashboard, MapPin, Package, Shield, User, Users, Wrench } from 'lucide-react'
import { useAuth } from '@/context/ContextoAutenticacion'
import { GuardRol } from '@/components/auth/GuardRol'
import { formatearRol } from '@/utils/formatters'
import type { Rol } from '@/types'
import logo from '@/assets/logo.svg'

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
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const menuItems = [
  { title: 'Panel', url: '/', icon: LayoutDashboard },
  { title: 'Artículos', url: '/articulos', icon: Package },
  { title: 'Mantenimiento', url: '/mantenimiento', icon: Wrench },
  { title: 'Ubicaciones', url: '/ubicaciones', icon: MapPin },
  { title: 'Categorías', url: '/categorias', icon: FolderOpen },
]

function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function useRutaActiva(url: string, end = false): boolean {
  const { pathname } = useLocation()
  if (end) {
    return pathname === url
  }
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function BarraLateralAplicacion() {
  const { user } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 justify-center border-b px-4">
        <div className="flex items-center gap-2.5 font-semibold">
          <img
            src={logo}
            alt="Logo"
            className="size-7 dark:invert"
          />
          Inventario Lab
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const activo = useRutaActiva(item.url, item.url === '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={activo}>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span className="flex-1">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Auditoría — solo profesor */}
              <GuardRol roles={['profesor']}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={useRutaActiva('/auditoria')}>
                    <NavLink to="/auditoria">
                      <Shield />
                      <span>Auditoría</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </GuardRol>

              {/* Usuarios — solo profesor */}
              <GuardRol roles={['profesor']}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={useRutaActiva('/usuarios')}>
                    <NavLink to="/usuarios">
                      <Users />
                      <span>Usuarios</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </GuardRol>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={useRutaActiva('/perfil')} className="h-auto rounded-lg px-3 py-2.5 hover:bg-sidebar-accent">
                <NavLink to="/perfil" className="group">
                  <Avatar className="size-8 shrink-0 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {iniciales(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start overflow-hidden leading-tight">
                    <span className="w-full truncate text-sm font-semibold">{user.displayName}</span>
                    <span className="w-full truncate text-[11px] text-muted-foreground">
                      {formatearRol(user.role as unknown as Rol) ?? user.role}
                    </span>
                  </div>
                  <User className="ml-auto size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
