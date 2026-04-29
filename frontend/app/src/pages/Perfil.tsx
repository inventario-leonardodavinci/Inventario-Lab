import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useNotificaciones } from "@/hooks/queries";
import {
  actualizarNombreUsuario,
  obtenerEmailUsuario,
  enviarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  restablecerContrasena,
} from "@/services/authApi";
import { CheckCircle2, Clock, LogIn, Shield, User } from "lucide-react";
import { toast } from "sonner";

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
  consulta: "Consulta",
};

const COLOR_ROL: Record<string, string> = {
  admin: "destructive",
  tecnico: "default",
  consulta: "secondary",
};

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type TabActiva = "perfil" | "seguridad";

export default function Perfil() {
  const { user, actualizarUsuario } = useAuth();
  const [searchParams] = useSearchParams();

  const tabInicial: TabActiva =
    searchParams.get("tab") === "seguridad" ? "seguridad" : "perfil";
  const [tab, setTab] = useState<TabActiva>(tabInicial);

  // ─── Estado perfil ────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user?.displayName ?? "");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  // ─── Actividad reciente via TanStack Query ────────────────────────────────
  const { data: notifData } = useNotificaciones(user?.authUserId);
  const actividad = (notifData?.data ?? []).slice(0, 8);

  // ─── Estado seguridad ─────────────────────────────────────────────────────
  const [pasoCambio, setPasoCambio] = useState<"solicitar" | "codigo" | "nueva">("solicitar");
  const [codigoReset, setCodigoReset] = useState("");
  const [tokenReset, setTokenReset] = useState<string | null>(null);
  const [nuevaPass, setNuevaPass] = useState("");
  const [confirmarPass, setConfirmarPass] = useState("");
  const [submittingPass, setSubmittingPass] = useState(false);

  useEffect(() => {
    obtenerEmailUsuario().then(setEmail).catch(() => {});
  }, []);

  if (!user) return null;

  // ─── Guardar nombre ───────────────────────────────────────────────────────
  const onGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || nombre.trim() === user.displayName) return;
    setGuardandoNombre(true);
    try {
      await actualizarNombreUsuario(user.authUserId, nombre.trim());
      actualizarUsuario({ displayName: nombre.trim() });
      toast.success("Nombre actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar el nombre");
    } finally {
      setGuardandoNombre(false);
    }
  };

  // ─── Cambio de contraseña ─────────────────────────────────────────────────
  const onSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmittingPass(true);
    try {
      await enviarCodigoRecuperacion(email);
      setPasoCambio("codigo");
      toast.info("Código enviado a tu correo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el código");
    } finally {
      setSubmittingPass(false);
    }
  };

  const onVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmittingPass(true);
    try {
      const token = await verificarCodigoRecuperacion(email, codigoReset.trim());
      setTokenReset(token);
      setPasoCambio("nueva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setSubmittingPass(false);
    }
  };

  const onCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPass !== confirmarPass) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSubmittingPass(true);
    try {
      await restablecerContrasena(nuevaPass, tokenReset!);
      toast.success("Contraseña actualizada correctamente");
      setPasoCambio("solicitar");
      setCodigoReset("");
      setTokenReset(null);
      setNuevaPass("");
      setConfirmarPass("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setSubmittingPass(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Mi perfil</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona tu información personal y seguridad de la cuenta.
        </p>
      </div>

      {/* Tarjeta de identidad */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="size-16 text-xl">
            <AvatarFallback className="font-semibold">
              {iniciales(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{user.displayName}</p>
            {email && <p className="text-sm text-muted-foreground">{email}</p>}
            <Badge variant={COLOR_ROL[user.role] as "default" | "secondary" | "destructive"} className="w-fit">
              {ETIQUETA_ROL[user.role] ?? user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["perfil", "seguridad"] as TabActiva[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "perfil" ? "Información" : "Seguridad"}
          </button>
        ))}
      </div>

      {/* ─── Tab: Perfil ─────────────────────────────────────────────────── */}
      {tab === "perfil" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editar nombre */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Información personal
              </CardTitle>
              <CardDescription>Actualiza tu nombre visible en el sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onGuardarNombre}>
                <div className="space-y-2">
                  <Label htmlFor="nombre-perfil">Nombre completo</Label>
                  <Input
                    id="nombre-perfil"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input value={email ?? "—"} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    El correo no se puede cambiar desde aquí.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={guardandoNombre || !nombre.trim() || nombre.trim() === user.displayName}
                >
                  {guardandoNombre ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" />
                Actividad reciente
              </CardTitle>
              <CardDescription>Últimas notificaciones y eventos de tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent>
              {actividad.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
              ) : (
                <ul className="space-y-3">
                  {actividad.map((item, idx) => (
                    <li key={item.id}>
                      <div className="flex items-start gap-3">
                        <LogIn className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatearFecha(item.created_at)}
                          </p>
                        </div>
                      </div>
                      {idx < actividad.length - 1 && <Separator className="mt-3" />}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Tab: Seguridad ──────────────────────────────────────────────── */}
      {tab === "seguridad" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4" />
                Cambiar contraseña
              </CardTitle>
              <CardDescription>
                {pasoCambio === "solicitar" && "Recibirás un código en tu correo para verificar el cambio."}
                {pasoCambio === "codigo" && `Introduce el código de 6 dígitos enviado a ${email}.`}
                {pasoCambio === "nueva" && "Elige tu nueva contraseña."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pasoCambio === "solicitar" && (
                <form onSubmit={onSolicitarCodigo} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Correo: <strong>{email ?? "—"}</strong>
                  </p>
                  <Button type="submit" disabled={submittingPass || !email}>
                    {submittingPass ? "Enviando..." : "Enviar código de verificación"}
                  </Button>
                </form>
              )}

              {pasoCambio === "codigo" && (
                <form onSubmit={onVerificarCodigo} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo-cambio">Código de verificación</Label>
                    <Input
                      id="codigo-cambio"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={codigoReset}
                      onChange={(e) => setCodigoReset(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-xl tracking-widest"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingPass || codigoReset.length < 6}>
                      {submittingPass ? "Verificando..." : "Verificar código"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setPasoCambio("solicitar")}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {pasoCambio === "nueva" && (
                <form onSubmit={onCambiarContrasena} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nueva-pass-perfil">Nueva contraseña</Label>
                    <Input
                      id="nueva-pass-perfil"
                      type="password"
                      value={nuevaPass}
                      onChange={(e) => setNuevaPass(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar-pass-perfil">Confirmar contraseña</Label>
                    <Input
                      id="confirmar-pass-perfil"
                      type="password"
                      value={confirmarPass}
                      onChange={(e) => setConfirmarPass(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" disabled={submittingPass}>
                    {submittingPass ? "Guardando..." : "Cambiar contraseña"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Info de sesión */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-green-500" />
                Sesión activa
              </CardTitle>
              <CardDescription>Información sobre tu sesión actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usuario</span>
                <span className="font-medium">{user.displayName}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Correo</span>
                <span className="font-medium">{email ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rol</span>
                <Badge variant={COLOR_ROL[user.role] as "default" | "secondary" | "destructive"}>
                  {ETIQUETA_ROL[user.role] ?? user.role}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID de usuario</span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                  {user.authUserId}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
