import { createContext, useContext, useMemo, useState } from "react";

type EstadoAutenticacion = {
  authUserId: string;
  displayName: string;
  role: "admin" | "tecnico" | "consulta";
};

type ValorContextoAutenticacion = {
  user: EstadoAutenticacion | null;
  login: (nextUser: EstadoAutenticacion) => void;
  logout: () => void;
};

const CLAVE_ALMACENAMIENTO_AUTENTICACION = "inventario.auth";

const ContextoAutenticacion = createContext<ValorContextoAutenticacion | undefined>(undefined);

function cargarUsuarioInicial(): EstadoAutenticacion | null {
  const raw = localStorage.getItem(CLAVE_ALMACENAMIENTO_AUTENTICACION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EstadoAutenticacion;
  } catch {
    return null;
  }
}

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EstadoAutenticacion | null>(() => cargarUsuarioInicial());

  const value = useMemo<ValorContextoAutenticacion>(
    () => ({
      user,
      login: (nextUser) => {
        setUser(nextUser);
        localStorage.setItem(CLAVE_ALMACENAMIENTO_AUTENTICACION, JSON.stringify(nextUser));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(CLAVE_ALMACENAMIENTO_AUTENTICACION);
      },
    }),
    [user],
  );

  return <ContextoAutenticacion.Provider value={value}>{children}</ContextoAutenticacion.Provider>;
}

export function useAuth() {
  const context = useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de ProveedorAutenticacion");
  }
  return context;
}
