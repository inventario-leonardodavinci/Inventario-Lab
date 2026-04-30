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
import { LogOut, Settings, User } from "lucide-react";

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const COLORES_ROL: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  tecnico: "bg-blue-100 text-blue-700",
  consulta: "bg-gray-100 text-gray-600",
};

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
  consulta: "Consulta",
};

export function MenuUsuario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const colorRol = COLORES_ROL[user.role] ?? "bg-gray-100 text-gray-600";
  const etiquetaRol = ETIQUETA_ROL[user.role] ?? user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de usuario"
        >
          <Avatar className="size-7">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback className="text-xs font-medium">
              {iniciales(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">
            {user.displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="truncate font-medium">{user.displayName}</p>
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${colorRol}`}
            >
              {etiquetaRol}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/perfil")}>
          <User className="mr-2 size-4" />
          Mi perfil
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/perfil?tab=seguridad")}>
          <Settings className="mr-2 size-4" />
          Seguridad
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
