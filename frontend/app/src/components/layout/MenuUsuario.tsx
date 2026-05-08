import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/ContextoAutenticacion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, Shield, User } from "lucide-react";

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const COLORES_ROL: Record<string, string> = {
  profesor: 'bg-primary/10 text-primary',
  consultor: 'bg-muted text-muted-foreground',
}

const ETIQUETA_ROL: Record<string, string> = {
  profesor: 'Profesor',
  consultor: 'Consultor',
}

export function MenuUsuario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const colorRol = COLORES_ROL[user.role] ?? 'bg-muted text-muted-foreground'
  const etiquetaRol = ETIQUETA_ROL[user.role] ?? user.role

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center gap-2 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de usuario"
        >
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {iniciales(user.displayName)}
            </AvatarFallback>
          </Avatar>
          {/* Indicador de estado online */}
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-1.5">
        {/* Cabecera de identidad */}
        <DropdownMenuLabel className="font-normal p-0 mb-1">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {iniciales(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-semibold leading-none">{user.displayName}</p>
              <span className={`w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colorRol}`}>
                {etiquetaRol}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/perfil")} className="gap-3 rounded-lg px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <User className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">Mi perfil</span>
            <span className="text-[11px] text-muted-foreground">Foto, nombre y datos</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/perfil?tab=seguridad")} className="gap-3 rounded-lg px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <Settings className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">Seguridad</span>
            <span className="text-[11px] text-muted-foreground">Contraseña y sesiones</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/perfil?tab=historial")} className="gap-3 rounded-lg px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <Shield className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">Accesos</span>
            <span className="text-[11px] text-muted-foreground">Historial de sesiones</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => void logout()}
          className="gap-3 rounded-lg px-3 py-2"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10">
            <LogOut className="size-3.5 text-destructive" />
          </div>
          <span className="text-sm">Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
