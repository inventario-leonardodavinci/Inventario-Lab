import React, { useEffect, useState, useRef, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EditorRecorteImagen } from "@/components/ui/EditorRecorteImagen";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useNotificaciones, usePerfil, useActualizarPerfil, useHistorialSesiones, useEliminarSesion } from "@/hooks/queries";
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
  Trash2,
  RefreshCw,
  XCircle,
  Link2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { SkeletonPerfil } from "@/components/ui/PageSkeleton";

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

type TabActiva = "perfil" | "seguridad" | "historial";

export default function Perfil() {
  const { user, actualizarUsuario } = useAuth();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get("tab")
  const tabInicial: TabActiva =
    tabParam === "seguridad" ? "seguridad" :
    tabParam === "historial" ? "historial" : "perfil";
  const [tab, setTab] = useState<TabActiva>(tabInicial);

  // ─── Estado perfil ────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user?.displayName ?? "");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);

  // ─── Estado avatar ────────────────────────────────────────────────────────
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const avatarLocal = user?.avatarUrl;
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
  const eliminarSesionMutation = useEliminarSesion();

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

  if (!user) return <SkeletonPerfil />;

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
    if (!tokenReset) { toast.error("Token de verificación no disponible. Solicita un nuevo código."); setPasoCambio("solicitar"); return; }
    setSubmittingPass(true);
    try {
      await restablecerContrasena(nuevaPass, tokenReset);
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
      // Convertir avatar a base64 para que funcione sin sesión activa
      let avatarParaGuardar = "";
      if (user.avatarUrl) {
        try {
          const res = await fetch(user.avatarUrl);
          const blob = await res.blob();
          avatarParaGuardar = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          // Si falla (CORS, etc.) guardar la URL original como fallback
          avatarParaGuardar = user.avatarUrl;
        }
      }
      localStorage.setItem("ultimo_usuario:v1", JSON.stringify({
        nombre: user.displayName,
        email: email ?? "",
        avatarUrl: avatarParaGuardar,
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
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="page-section flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
      <Card className="page-section overflow-hidden border-primary/10 shadow-sm p-0! gap-0!">
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
          { id: "historial", label: "Accesos", icon: History },
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <KeyRound className="size-4 text-primary" />
                </div>
                Cambiar contraseña
              </CardTitle>
              <CardDescription>
                {pasoCambio === "solicitar" && "Te enviaremos un código de 6 dígitos a tu correo."}
                {pasoCambio === "codigo" && `Revisa ${email ?? "tu correo"} e introduce el código recibido.`}
                {pasoCambio === "nueva" && "Elige una contraseña segura para tu cuenta."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">

              {/* ── Stepper ── */}
              <div className="flex items-center gap-0">
                {[
                  { n: 1, label: "Correo" },
                  { n: 2, label: "Código" },
                  { n: 3, label: "Contraseña" },
                ].map(({ n, label }, i, arr) => (
                  <Fragment key={n}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        n < pasoActual
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : n === pasoActual
                          ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {n < pasoActual ? <CheckCircle2 className="size-3.5" /> : n}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        n <= pasoActual ? "text-foreground" : "text-muted-foreground"
                      }`}>{label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`mb-4 h-px flex-1 mx-2 transition-colors ${
                        n < pasoActual ? "bg-primary" : "bg-border"
                      }`} />
                    )}
                  </Fragment>
                ))}
              </div>

              {/* ── Paso 1: Solicitar código ── */}
              {pasoCambio === "solicitar" && (
                <form onSubmit={onSolicitarCodigo} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Se enviará el código a</p>
                      <p className="truncate text-sm font-semibold">{email ?? "—"}</p>
                    </div>
                  </div>
                  <Button type="submit" disabled={submittingPass || !email} className="w-full">
                    {submittingPass
                      ? <><RefreshCw className="size-4 mr-2 animate-spin" />Enviando...</>
                      : <><Mail className="size-4 mr-2" />Enviar código</>}
                  </Button>
                </form>
              )}

              {/* ── Paso 2: Introducir código OTP ── */}
              {pasoCambio === "codigo" && (
                <form onSubmit={onVerificarCodigo} className="flex flex-col gap-5">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-muted-foreground">Introduce los 6 dígitos del correo</p>
                    <InputOTP
                      maxLength={6}
                      value={codigoReset}
                      onChange={setCodigoReset}
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-11 text-lg" />
                        <InputOTPSlot index={1} className="size-11 text-lg" />
                        <InputOTPSlot index={2} className="size-11 text-lg" />
                        <InputOTPSlot index={3} className="size-11 text-lg" />
                        <InputOTPSlot index={4} className="size-11 text-lg" />
                        <InputOTPSlot index={5} className="size-11 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      onClick={(e) => { e.preventDefault(); void onSolicitarCodigo(e as unknown as React.FormEvent); }}
                    >
                      No recibiste el código? Reenviar
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingPass || codigoReset.length < 6} className="flex-1">
                      {submittingPass
                        ? <><RefreshCw className="size-4 mr-2 animate-spin" />Verificando...</>
                        : <><CheckCircle2 className="size-4 mr-2" />Verificar código</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setPasoCambio("solicitar"); setCodigoReset(""); }}>
                      Atrás
                    </Button>
                  </div>
                </form>
              )}

              {/* ── Paso 3: Nueva contraseña ── */}
              {pasoCambio === "nueva" && (
                <form onSubmit={onCambiarContrasena} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nueva-pass-perfil">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="nueva-pass-perfil"
                        type={mostrarPass.nueva ? "text" : "password"}
                        value={nuevaPass}
                        onChange={(e) => setNuevaPass(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="pr-10"
                        autoFocus
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setMostrarPass(p => ({ ...p, nueva: !p.nueva }))}
                      >
                        {mostrarPass.nueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {/* Barra de fuerza */}
                    {nuevaPass.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          {[1,2,3].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              fuerzaPass === "débil" && i === 1 ? "bg-destructive" :
                              fuerzaPass === "media" && i <= 2 ? "bg-yellow-500" :
                              fuerzaPass === "fuerte" ? "bg-green-500" :
                              "bg-muted"
                            }`} />
                          ))}
                        </div>
                        <p className={`text-[11px] font-medium ${
                          fuerzaPass === "débil" ? "text-destructive" :
                          fuerzaPass === "media" ? "text-yellow-500" : "text-green-600"
                        }`}>
                          Contraseña {fuerzaPass}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmar-pass-perfil">Confirmar contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmar-pass-perfil"
                        type={mostrarPass.confirmar ? "text" : "password"}
                        value={confirmarPass}
                        onChange={(e) => setConfirmarPass(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className={`pr-10 ${
                          confirmarPass && nuevaPass !== confirmarPass ? "border-destructive focus-visible:ring-destructive/30" : ""
                        }`}
                        placeholder="Repite la contraseña"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setMostrarPass(p => ({ ...p, confirmar: !p.confirmar }))}
                      >
                        {mostrarPass.confirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirmarPass && nuevaPass !== confirmarPass && (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <XCircle className="size-3" /> Las contraseñas no coinciden
                      </p>
                    )}
                    {confirmarPass && nuevaPass === confirmarPass && (
                      <p className="text-[11px] text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Las contraseñas coinciden
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={submittingPass || !nuevaPass || nuevaPass !== confirmarPass}
                      className="flex-1"
                    >
                      {submittingPass
                        ? <><RefreshCw className="size-4 mr-2 animate-spin" />Guardando...</>
                        : <><KeyRound className="size-4 mr-2" />Cambiar contraseña</>}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setPasoCambio("solicitar"); setCodigoReset(""); setTokenReset(null); setNuevaPass(""); setConfirmarPass(""); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

            </CardContent>
          </Card>

          {/* Info de seguridad */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Shield className="size-4 text-amber-600" />
                </div>
                Recomendaciones
              </CardTitle>
              <CardDescription>Consejos para mantener tu cuenta segura.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", tip: "Usa al menos 10 caracteres mezclando letras, números y símbolos." },
                { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", tip: "No reutilices la misma contraseña en otros sitios." },
                { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", tip: "Nunca compartas tu contraseña con nadie, ni con soporte." },
                { icon: Info, color: "text-primary", bg: "bg-primary/10", tip: "Cambiar la contraseña cierra todas las sesiones activas en otros dispositivos." },
              ].map(({ icon: Icon, color, bg, tip }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${bg}`}>
                    <Icon className={`size-3.5 ${color}`} />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      )}

      {/* ── Tab: Historial ───────────────────────────────────────────────── */}
      {tab === "historial" && (
        <div className="grid gap-6 lg:grid-cols-3">
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                      <History className="size-4 text-primary" />
                    </div>
                    Historial de accesos
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Últimos {historialData?.data?.length ?? 0} accesos registrados.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Para cerrar sesión en todos los dispositivos,{" "}
                  <button type="button" className="underline underline-offset-2 font-medium hover:no-underline" onClick={() => setTab("seguridad")}>cambia tu contraseña</button>{" "}
                  desde Seguridad. Esto invalida todas las sesiones activas.
                </span>
              </div>
              {cargandoHistorial ? (
                <div className="divide-y">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="flex items-start gap-3 py-3.5">
                      <div className="mt-0.5 size-8 shrink-0 rounded-lg bg-muted animate-pulse" />
                      <div className="flex flex-1 flex-col gap-2 pt-1">
                        <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !historialData?.data?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <History className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin registros aún</p>
                  <p className="text-xs text-muted-foreground mt-1">El historial se irá llenando con cada inicio de sesión.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {historialData.data.map((sesion, idx) => {
                    const esActual = idx === 0;
                    const IconoDispositivo = sesion.dispositivo === "Móvil" ? Smartphone : sesion.dispositivo === "Tablet" ? Tablet : Monitor;
                    const configEvento = {
                      login:   { label: "Contraseña", icon: LogIn,     color: "text-primary",           bg: "bg-primary/10" },
                      oauth:   { label: "OAuth",       icon: Link2,     color: "text-violet-600",        bg: "bg-violet-500/10" },
                      refresh: { label: "Renovación",  icon: RefreshCw, color: "text-amber-600",         bg: "bg-amber-500/10" },
                      logout:  { label: "Cierre",      icon: LogOut,    color: "text-muted-foreground",  bg: "bg-muted" },
                    }[sesion.tipo_evento] ?? { label: sesion.tipo_evento, icon: LogIn, color: "text-muted-foreground", bg: "bg-muted" };
                    const IconoEvento = configEvento.icon;
                    const borrando = eliminarSesionMutation.isPending && eliminarSesionMutation.variables === sesion.id;
                    return (
                      <li key={sesion.id} className={`group flex items-start gap-3 py-3.5 transition-colors ${ esActual ? "rounded-lg bg-green-500/5 px-3 -mx-3" : "" } ${!sesion.exitoso ? "opacity-60" : ""}` }>
                        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${ esActual ? "bg-green-500/15 text-green-600" : `${configEvento.bg} ${configEvento.color}` }`}>
                          {esActual ? <IconoDispositivo className="size-4" /> : <IconoEvento className="size-4" />}
                        </div>
                        <div className="flex flex-1 flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-medium ${!sesion.exitoso ? "text-destructive line-through" : ""}`}>
                              {sesion.navegador ?? "Navegador desconocido"}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{sesion.sistema_operativo ?? "SO desconocido"}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className={`text-xs font-medium ${configEvento.color}`}>{configEvento.label}</span>
                            {esActual && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-500/40 bg-green-500/5 gap-1 py-0">
                                <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                Sesión actual
                              </Badge>
                            )}
                            {!sesion.exitoso && (
                              <Badge variant="destructive" className="text-xs gap-1 py-0">
                                <XCircle className="size-2.5" /> Fallido
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconoDispositivo className="size-3 shrink-0" />
                              {sesion.dispositivo ?? "Escritorio"}
                            </span>
                            {sesion.ip_address && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                <Globe className="size-3 shrink-0" />
                                {sesion.ip_address}
                              </span>
                            )}
                            {(sesion.ciudad ?? sesion.pais) && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                {[sesion.ciudad, sesion.pais].filter(Boolean).join(", ")}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">{formatearFecha(sesion.iniciada_en)}</span>
                          </div>
                        </div>
                        {!esActual && (
                          <button
                            type="button"
                            onClick={() => eliminarSesionMutation.mutate(sesion.id, {
                              onSuccess: () => toast.success("Registro eliminado"),
                              onError: () => toast.error("No se pudo eliminar el registro"),
                            })}
                            disabled={borrando || eliminarSesionMutation.isPending}
                            className="ml-1 mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Eliminar este registro de sesión"
                          >
                            {borrando ? <RefreshCw className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </button>
                        )}
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
