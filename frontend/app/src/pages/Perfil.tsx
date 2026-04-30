import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EditorRecorteImagen } from "@/components/ui/EditorRecorteImagen";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useNotificaciones, usePerfil, useActualizarPerfil, useHistorialSesiones } from "@/hooks/queries";
import {
  actualizarNombreUsuario,
  actualizarCampoPerfil,
  enviarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  restablecerContrasena,
  logoutDeInsforge,
} from "@/services/authApi";
import { formatearRol } from "@/utils/formatters";
import type { Rol } from "@/types";
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogIn,
  LogOut,
  Shield,
  User,
  Mail,
  Calendar,
  Pencil,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  KeyRound,
  Info,
} from "lucide-react";
import { toast } from "sonner";

const COLOR_ROL: Record<string, string> = {
  admin: "destructive",
  administrador: "destructive",
  tecnico: "default",
  profesor: "default",
  consulta: "secondary",
  consultor: "secondary",
};

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function formatearFecha(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function fechaRelativa(iso: string): string {
  if (!iso) return "";
  const ahora = new Date();
  const creada = new Date(iso);
  const diffMs = ahora.getTime() - creada.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Ayer";
  if (diffDias < 30) return `Hace ${diffDias} días`;
  if (diffDias < 365) return `Hace ${Math.floor(diffDias / 30)} meses`;
  return `Hace ${Math.floor(diffDias / 365)} año${Math.floor(diffDias / 365) > 1 ? "s" : ""}`;
}

function comprimirImagen(base64: string, maxW: number, maxH: number, calidad: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = reject;
    img.src = base64;
  });
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
  const [editandoNombre, setEditandoNombre] = useState(false);

  // ─── Estado avatar ────────────────────────────────────────────────────────
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const avatarLocal = user.avatarUrl;
  const [imagenSinRecortar, setImagenSinRecortar] = useState<string | null>(null);
  const [imagenOriginal, setImagenOriginal] = useState<string | null>(null);
  const editorAbierto = imagenSinRecortar !== null;
  // ─── Datos del perfil desde la API ────────────────────────────────────────
  usePerfil();
  const actualizarPerfilMutation = useActualizarPerfil();

  // ─── Actividad reciente via TanStack Query ────────────────────────────────
  const { data: notifData } = useNotificaciones();
  const actividad = (notifData?.data ?? []).slice(0, 8);
  const alertasPendientes = actividad.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a) => (a as any).status === "abierta" || (a as any).status === "open"
  ).length;

  // ─── Estado seguridad ─────────────────────────────────────────────────────
  const [pasoCambio, setPasoCambio] = useState<"solicitar" | "codigo" | "nueva">("solicitar");
  const [codigoReset, setCodigoReset] = useState("");
  const [tokenReset, setTokenReset] = useState<string | null>(null);
  const [nuevaPass, setNuevaPass] = useState("");
  const [confirmarPass, setConfirmarPass] = useState("");
  const [submittingPass, setSubmittingPass] = useState(false);
  const [mostrarPass, setMostrarPass] = useState({ nueva: false, confirmar: false });

  // ─── Estado cerrar sesión ─────────────────────────────────────────────────
  const [cerrandoSesion, setCerrarandoSesion] = useState(false);

  // ─── Historial de sesiones ────────────────────────────────────────────────
  const { data: historialData, isLoading: cargandoHistorial } = useHistorialSesiones();

  useEffect(() => {
    import("@/services/authApi").then(({ obtenerUsuarioCompleto }) => {
      obtenerUsuarioCompleto().then((u) => {
        if (u) {
          setEmail(u.email);
          const original = (u.profile as Record<string, unknown> | null)?.avatar_url_original;
          if (typeof original === "string" && original) {
            setImagenOriginal(original);
          }
        }
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (user?.displayName) setNombre(user.displayName);
  }, [user?.displayName]);

  if (!user) return null;

  // ─── Guardar nombre ───────────────────────────────────────────────────────
  const onGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || nombre.trim() === user.displayName) {
      setEditandoNombre(false);
      return;
    }
    setGuardandoNombre(true);
    try {
      await actualizarNombreUsuario(user.authUserId, nombre.trim());
      await actualizarPerfilMutation.mutateAsync({ nombre_visible: nombre.trim() });
      actualizarUsuario({ displayName: nombre.trim() });
      toast.success("Nombre actualizado correctamente");
      setEditandoNombre(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar el nombre");
      setNombre(user.displayName);
    } finally {
      setGuardandoNombre(false);
    }
  };

  // ─── Subir avatar ─────────────────────────────────────────────────────────
  const onSeleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (archivo.size > 5 * 1024 * 1024) { toast.error("La imagen no debe superar 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImagenOriginal(src);
      setImagenSinRecortar(src);
    };
    reader.readAsDataURL(archivo);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  };

  const onAplicarRecorte = async (imagenRecortada: string) => {
    setSubiendoAvatar(true);
    try {
      const comprimida = await comprimirImagen(imagenRecortada, 200, 200, 0.75);
      // Guardar la original sin comprimir para poder re-editar después
      const original = imagenSinRecortar;
      await Promise.all([
        actualizarCampoPerfil("avatar_url", comprimida),
        original ? actualizarCampoPerfil("avatar_url_original", original) : Promise.resolve(),
      ]);
      actualizarUsuario({ avatarUrl: comprimida });
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("Error al actualizar la foto");
    } finally {
      setSubiendoAvatar(false);
      setImagenSinRecortar(null);
    }
  };

  const onCancelarRecorte = () => setImagenSinRecortar(null);

  const onQuitarAvatar = async () => {
    try {
      await Promise.all([
        actualizarCampoPerfil("avatar_url", ""),
        actualizarCampoPerfil("avatar_url_original", ""),
      ]);
      actualizarUsuario({ avatarUrl: undefined });
      setImagenOriginal(null);
      toast.info("Foto de perfil eliminada");
    } catch {
      toast.error("Error al eliminar la foto");
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
    if (nuevaPass !== confirmarPass) { toast.error("Las contraseñas no coinciden"); return; }
    if (nuevaPass.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setSubmittingPass(true);
    try {
      await restablecerContrasena(nuevaPass, tokenReset!);
      toast.success("Contraseña actualizada correctamente");
      setPasoCambio("solicitar");
      setCodigoReset(""); setTokenReset(null); setNuevaPass(""); setConfirmarPass("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setSubmittingPass(false);
    }
  };

  // ─── Cerrar sesión ────────────────────────────────────────────────────────
  const onCerrarSesion = async () => {
    setCerrarandoSesion(true);
    try {
      // Guardar datos del último usuario para mostrarlos en el login
      localStorage.setItem("ultimo_usuario", JSON.stringify({
        nombre: user.displayName,
        email: email ?? "",
        avatarUrl: user.avatarUrl ?? "",
      }));
      await logoutDeInsforge();
      window.location.href = "/login";
    } catch {
      toast.error("Error al cerrar sesión");
      setCerrarandoSesion(false);
    }
  };

  const fuerzaPass = nuevaPass.length === 0
    ? null
    : nuevaPass.length < 6 ? "débil"
    : nuevaPass.length < 10 ? "media"
    : "fuerte";

  const pasos = ["solicitar", "codigo", "nueva"] as const;
  const pasoActual = pasos.indexOf(pasoCambio) + 1;

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mi perfil</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tu información personal y seguridad de la cuenta.
          </p>
        </div>
        <Button variant="outline" onClick={onCerrarSesion} disabled={cerrandoSesion} className="gap-2 self-start sm:self-auto">
          <LogOut className="size-4" />
          {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </div>

      {/* ── Tarjeta de identidad ─────────────────────────────────────────── */}
      <Card className="overflow-hidden border-primary/10 shadow-sm p-0! gap-0!">
        <CardContent className="relative flex flex-col gap-4 overflow-hidden p-0! sm:flex-row sm:items-center">
          {/* Fondo degradado */}
          <div className="absolute inset-0 bg-linear-to-r from-primary/15 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Contenido */}
          <div className="relative flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center w-full">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <button
                className="relative focus:outline-none"
                aria-label="Editar foto de perfil"
                disabled={subiendoAvatar}
                onClick={() => {
                  if (avatarLocal) {
                    setImagenSinRecortar(imagenOriginal ?? avatarLocal);
                  } else {
                    inputArchivoRef.current?.click();
                  }
                }}
              >
                <Avatar className="size-20 text-xl ring-4 ring-background shadow-lg transition-all group-hover:shadow-xl cursor-pointer">
                  <AvatarImage src={avatarLocal} alt={user.displayName} />
                  <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">
                    {iniciales(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                  <Camera className="size-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary shadow-md ring-2 ring-background pointer-events-none">
                  <Camera className="size-3 text-primary-foreground" />
                </div>
              </button>
              <input ref={inputArchivoRef} type="file" accept="image/*" className="hidden" onChange={onSeleccionarImagen} disabled={subiendoAvatar} />
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-2xl font-bold tracking-tight">{user.displayName}</p>
              {email && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant={COLOR_ROL[user.role] as "default" | "secondary" | "destructive"} className="gap-1.5 px-2.5 py-0.5">
                  <Shield className="size-3" />
                  {formatearRol((user.role as unknown) as Rol) ?? user.role}
                </Badge>
                {alertasPendientes > 0 && (
                  <Badge variant="destructive" className="gap-1.5">
                    <AlertTriangle className="size-3" />
                    {alertasPendientes} alerta{alertasPendientes > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 rounded-xl bg-muted/60 p-1 w-fit border border-border/50">
        {([
          { id: "perfil", label: "Información", icon: Info },
          { id: "seguridad", label: "Seguridad", icon: Shield },
        ] as { id: TabActiva; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Perfil ──────────────────────────────────────────────────── */}
      {tab === "perfil" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editar nombre */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <User className="size-4 text-primary" />
                </div>
                Información personal
              </CardTitle>
              <CardDescription>Actualiza tu nombre visible en el sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onGuardarNombre}>
                <div className="space-y-2">
                  <Label htmlFor="nombre-perfil">Nombre completo</Label>
                  {editandoNombre ? (
                    <div className="flex gap-2">
                      <Input id="nombre-perfil" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" autoComplete="name" className="flex-1" autoFocus />
                      <Button type="submit" size="sm" disabled={guardandoNombre || !nombre.trim() || nombre.trim() === user.displayName}>
                        {guardandoNombre ? "..." : "Guardar"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setEditandoNombre(false); setNombre(user.displayName); }}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input id="nombre-perfil" value={nombre} disabled className="bg-muted/50" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setEditandoNombre(true)} aria-label="Editar nombre">
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input value={email ?? "—"} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí.</p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Datos de cuenta */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="size-4 text-primary" />
                </div>
                Datos de la cuenta
              </CardTitle>
              <CardDescription>Información general de tu registro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Cuenta creada</span>
                <span className="font-medium">{formatearFecha(user.createdAt)}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Antigüedad</span>
                <span className="font-medium">{fechaRelativa(user.createdAt)}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">ID de usuario</span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">{user.authUserId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="size-4 text-primary" />
                </div>
                Actividad reciente
              </CardTitle>
              <CardDescription>Últimas notificaciones y eventos de tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent>
              {actividad.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Clock className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin actividad reciente</p>
                  <p className="text-xs text-muted-foreground mt-1">Las notificaciones aparecerán aquí.</p>
                </div>
              ) : (
                <ul className="space-y-0 divide-y">
                  {actividad.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 py-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <LogIn className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.body}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 sm:mt-0 shrink-0 sm:ml-4">{fechaRelativa(item.created_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Seguridad ───────────────────────────────────────────────── */}
      {tab === "seguridad" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cambiar contraseña */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <KeyRound className="size-4 text-primary" />
                </div>
                Cambiar contraseña
              </CardTitle>
              <CardDescription>
                {pasoCambio === "solicitar" && "Recibirás un código en tu correo para verificar el cambio."}
                {pasoCambio === "codigo" && `Introduce el código de 6 dígitos enviado a ${email}.`}
                {pasoCambio === "nueva" && "Elige tu nueva contraseña segura."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Indicador de pasos */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-2">
                    <div className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      n < pasoActual ? "bg-primary text-primary-foreground" :
                      n === pasoActual ? "bg-primary/20 text-primary ring-2 ring-primary/30" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {n < pasoActual ? <CheckCircle2 className="size-3.5" /> : n}
                    </div>
                    {n < 3 && <div className={`h-px w-8 transition-colors ${n < pasoActual ? "bg-primary" : "bg-border"}`} />}
                  </div>
                ))}
                <span className="ml-1 text-xs text-muted-foreground">
                  {pasoCambio === "solicitar" ? "Solicitar código" : pasoCambio === "codigo" ? "Verificar código" : "Nueva contraseña"}
                </span>
              </div>

              {pasoCambio === "solicitar" && (
                <form onSubmit={onSolicitarCodigo} className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Se enviará un código a</p>
                    <p className="text-sm font-medium">{email ?? "—"}</p>
                  </div>
                  <Button type="submit" disabled={submittingPass || !email} className="w-full sm:w-auto">
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
                      placeholder="• • • • • •"
                      value={codigoReset}
                      onChange={(e) => setCodigoReset(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingPass || codigoReset.length < 6}>
                      {submittingPass ? "Verificando..." : "Verificar código"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setPasoCambio("solicitar")}>Cancelar</Button>
                  </div>
                </form>
              )}

              {pasoCambio === "nueva" && (
                <form onSubmit={onCambiarContrasena} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nueva-pass-perfil">Nueva contraseña</Label>
                    <div className="relative">
                      <Input id="nueva-pass-perfil" type={mostrarPass.nueva ? "text" : "password"} value={nuevaPass} onChange={(e) => setNuevaPass(e.target.value)} required minLength={6} autoComplete="new-password" className="pr-10" autoFocus />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setMostrarPass(p => ({ ...p, nueva: !p.nueva }))}>
                        {mostrarPass.nueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {fuerzaPass && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${
                            fuerzaPass === "débil" ? "w-1/3 bg-destructive" :
                            fuerzaPass === "media" ? "w-2/3 bg-yellow-500" :
                            "w-full bg-green-500"
                          }`} />
                        </div>
                        <span className={`text-xs font-medium ${fuerzaPass === "débil" ? "text-destructive" : fuerzaPass === "media" ? "text-yellow-500" : "text-green-500"}`}>{fuerzaPass}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar-pass-perfil">Confirmar contraseña</Label>
                    <div className="relative">
                      <Input id="confirmar-pass-perfil" type={mostrarPass.confirmar ? "text" : "password"} value={confirmarPass} onChange={(e) => setConfirmarPass(e.target.value)} required minLength={6} autoComplete="new-password" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setMostrarPass(p => ({ ...p, confirmar: !p.confirmar }))}>
                        {mostrarPass.confirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirmarPass && nuevaPass !== confirmarPass && (
                      <p className="text-xs text-destructive flex items-center gap-1">Las contraseñas no coinciden</p>
                    )}
                    {confirmarPass && nuevaPass === confirmarPass && (
                      <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="size-3" /> Las contraseñas coinciden</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingPass || nuevaPass !== confirmarPass}>
                      {submittingPass ? "Guardando..." : "Cambiar contraseña"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setPasoCambio("solicitar"); setCodigoReset(""); setTokenReset(null); setNuevaPass(""); setConfirmarPass(""); }}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Sesión activa */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="size-4 text-green-600" />
                </div>
                Sesión activa
              </CardTitle>
              <CardDescription>Información sobre tu sesión actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Usuario</span>
                <span className="font-medium">{user.displayName}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Correo</span>
                <span className="font-medium truncate max-w-[200px]">{email ?? "—"}</span>
              </div>
              <div className="flex justify-between py-3 text-sm items-center">
                <span className="text-muted-foreground">Rol</span>
                <Badge variant={COLOR_ROL[user.role] as "default" | "secondary" | "destructive"}>
                  {formatearRol((user.role as unknown) as Rol) ?? user.role}
                </Badge>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">ID de usuario</span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">{user.authUserId}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Registrado</span>
                <span className="font-medium">{formatearFecha(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Historial de sesiones */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <LogIn className="size-4 text-primary" />
                </div>
                Historial de inicios de sesión
              </CardTitle>
              <CardDescription>Últimos 20 accesos a tu cuenta con dispositivo, navegador e IP.</CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoHistorial ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                  <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando historial...
                </div>
              ) : !historialData?.data?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <LogIn className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin registros aún</p>
                  <p className="text-xs text-muted-foreground mt-1">El historial se irá llenando con cada inicio de sesión.</p>
                </div>
              ) : (
                <ul className="space-y-0 divide-y">
                  {historialData.data.map((sesion, idx) => {
                    const esActual = idx === 0;
                    const IconoDispositivo =
                      sesion.dispositivo === "Móvil" ? Smartphone :
                      sesion.dispositivo === "Tablet" ? Tablet : Monitor;
                    return (
                      <li key={sesion.id} className={`flex items-start gap-3 py-3.5 ${esActual ? "rounded-lg bg-green-500/5 px-3 -mx-3" : ""}`}>
                        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${esActual ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"}`}>
                          <IconoDispositivo className="size-4" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{sesion.navegador ?? "Navegador desconocido"}</span>
                              <span className="text-xs text-muted-foreground">en {sesion.sistema_operativo ?? "SO desconocido"}</span>
                              {esActual && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-500/40 bg-green-500/5 gap-1">
                                  <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Sesión actual
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="size-3" />
                                {sesion.ip_address ?? "IP desconocida"}
                              </span>
                              {(sesion.ciudad ?? sesion.pais) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="size-3" />
                                  {[sesion.ciudad, sesion.pais].filter(Boolean).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-1 sm:mt-0 shrink-0 sm:ml-4">
                            {formatearFecha(sesion.iniciada_en)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Editor de recorte */}
      <EditorRecorteImagen
        imagen={imagenSinRecortar ?? ""}
        abierto={editorAbierto}
        onCancelar={onCancelarRecorte}
        onAplicar={onAplicarRecorte}
        onCambiarFoto={() => inputArchivoRef.current?.click()}
        onEliminarFoto={avatarLocal ? async () => {
          await onQuitarAvatar();
          setImagenSinRecortar(null);
          setImagenOriginal(null);
        } : undefined}
      />
    </main>
  );
}
