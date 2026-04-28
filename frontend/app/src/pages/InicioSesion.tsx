import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/ContextoAutenticacion";
import { enviarEventoLogin } from "@/services/notificacionesApi";
import { toast } from "sonner";

export default function InicioSesion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState("Tecnico Laboratorio");
  const [authUserId, setAuthUserId] = useState("demo-user-1");
  const [role, setRole] = useState<"admin" | "tecnico" | "consulta">("tecnico");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      login({ authUserId, displayName, role });
      await enviarEventoLogin(authUserId);
      toast.success("Sesion iniciada");
      navigate("/");
    } catch {
      toast.warning("Sesion iniciada localmente. El backend no respondio.");
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso al sistema</CardTitle>
          <CardDescription>Inicia sesión para ver inventario y notificaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="display-name">Nombre visible</Label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-user-id">Identificador de usuario autenticado</Label>
              <Input id="auth-user-id" value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "tecnico" | "consulta")}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="admin">admin</option>
                <option value="tecnico">tecnico</option>
                <option value="consulta">consulta</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
