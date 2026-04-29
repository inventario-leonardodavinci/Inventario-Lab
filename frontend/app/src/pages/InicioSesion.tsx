import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/ContextoAutenticacion";
import { obtenerConfigAuth, type ConfiguracionAuth } from "@/services/authApi";
import { toast } from "sonner";

type Vista = "login" | "registro" | "verificar_email" | "recuperar_paso1" | "recuperar_paso2";

const ICONO_GOOGLE = (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ICONO_APPLE = (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.4.83 3.23.87.96-.19 1.88-.97 3.17-.87 1.34.11 2.35.64 3.01 1.62-2.76 1.65-2.3 5.28.59 6.32-.57 1.56-1.32 3.1-2 3.94zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

// Mapa de proveedores OAuth con su configuración visual
const OAUTH_CONFIG: Record<string, { label: string; icono: React.ReactNode; className: string }> = {
  google: {
    label: "Continuar con Google",
    icono: ICONO_GOOGLE,
    className: "w-full gap-2",
  },
  apple: {
    label: "Continuar con Apple",
    icono: ICONO_APPLE,
    className: "w-full gap-2 bg-black text-white hover:bg-black/90 border-black dark:bg-white dark:text-black dark:hover:bg-white/90",
  },
};

export default function InicioSesion() {
  const navigate = useNavigate();
  const { login, registro, verificarEmail, reenviarCodigo, enviarCodigoRecuperacion, loginConOAuth } = useAuth();

  const [vista, setVista] = useState<Vista>("login");
  const [config, setConfig] = useState<ConfiguracionAuth | null>(null);

  // Campos compartidos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState(""); // email esperando verificación
  const [submitting, setSubmitting] = useState(false);
  const [reenvioContador, setReenvioContador] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    obtenerConfigAuth()
      .then(setConfig)
      .catch(() => { /* usa defaults */ });
  }, []);

  // Contador de reenvío
  useEffect(() => {
    if (reenvioContador > 0) {
      timerRef.current = setInterval(() => {
        setReenvioContador((c) => {
          if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reenvioContador]);

  const irA = (v: Vista) => {
    setOtp("");
    setVista(v);
  };

  // ─── Login ──────────────────────────────────────────────────────────────────
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Registro ───────────────────────────────────────────────────────────────
  const onRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resultado = await registro(email.trim(), password, displayName.trim());
      if (resultado.tipo === "verificacion_requerida") {
        setPendingEmail(resultado.email);
        setReenvioContador(60);
        irA("verificar_email");
        toast.info("Revisa tu correo e introduce el código de 6 dígitos.");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Verificar email ────────────────────────────────────────────────────────
  const onVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verificarEmail(pendingEmail, otp.trim());
      toast.success("Correo verificado. ¡Bienvenido!");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setSubmitting(false);
    }
  };

  const onReenviar = async () => {
    try {
      await reenviarCodigo(pendingEmail);
      setReenvioContador(60);
      toast.success("Código reenviado. Revisa tu correo.");
    } catch {
      toast.error("No se pudo reenviar el código");
    }
  };

  // ─── Recuperar contraseña paso 1 ────────────────────────────────────────────
  const onRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await enviarCodigoRecuperacion(email.trim());
      setPendingEmail(email.trim());
      setReenvioContador(60);
      irA("recuperar_paso2");
      toast.info("Código enviado. Revisa tu correo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el código");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── OAuth ──────────────────────────────────────────────────────────────────
  const onOAuth = async (provider: string) => {
    try {
      await loginConOAuth(provider);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error con el proveedor");
    }
  };

  const oAuthProviders = config?.oAuthProviders ?? [];
  const minLen = config?.passwordMinLength ?? 6;

  // Renderiza los botones OAuth habilitados + separador
  const BotonesOAuth = oAuthProviders.length > 0 ? (
    <>
      <div className="space-y-2">
        {oAuthProviders.map((provider) => {
          const cfg = OAUTH_CONFIG[provider];
          if (!cfg) return null;
          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className={cfg.className}
              onClick={() => onOAuth(provider)}
            >
              {cfg.icono}
              {cfg.label}
            </Button>
          );
        })}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">o con correo</span>
        </div>
      </div>
    </>
  ) : null;

  // ─── Vista: verificar email ─────────────────────────────────────────────────
  if (vista === "verificar_email") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifica tu correo</CardTitle>
            <CardDescription>
              Hemos enviado un código de 6 dígitos a <strong>{pendingEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onVerificar}>
              <div className="space-y-2">
                <Label htmlFor="otp">Código de verificación</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || otp.length < 6}>
                {submitting ? "Verificando..." : "Verificar"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">¿No llegó el código?</span>
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onReenviar}
                  disabled={reenvioContador > 0}
                >
                  {reenvioContador > 0 ? `Reenviar en ${reenvioContador}s` : "Reenviar"}
                </button>
              </div>
              <Button type="button" variant="ghost" className="w-full" onClick={() => irA("login")}>
                Volver al inicio de sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─── Vista: recuperar paso 1 ────────────────────────────────────────────────
  if (vista === "recuperar_paso1") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              Introduce tu correo y te enviaremos un código para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onRecuperar}>
              <div className="space-y-2">
                <Label htmlFor="email-recuperar">Correo electrónico</Label>
                <Input
                  id="email-recuperar"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar código"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => irA("login")}>
                Volver al inicio de sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─── Vista: recuperar paso 2 (código + nueva contraseña) ───────────────────
  if (vista === "recuperar_paso2") {
    return <PasoRestablecerContrasena email={pendingEmail} onVolver={() => irA("login")} />;
  }

  // ─── Vista: registro ────────────────────────────────────────────────────────
  if (vista === "registro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Regístrate para acceder al sistema de inventario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BotonesOAuth}
            <form className="space-y-4" onSubmit={onRegistro}>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. María García"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-reg">Correo electrónico</Label>
                <Input
                  id="email-reg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-reg">Contraseña</Label>
                <Input
                  id="password-reg"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={minLen}
                />
                <p className="text-xs text-muted-foreground">Mínimo {minLen} caracteres.</p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => irA("login")}>
                Ya tengo cuenta
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─── Vista: login (default) ─────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso al sistema</CardTitle>
          <CardDescription>Inicia sesión para ver inventario y notificaciones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {BotonesOAuth}
          <form className="space-y-4" onSubmit={onLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => irA("recuperar_paso1")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => irA("registro")}>
              Crear una cuenta nueva
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

// ─── Subcomponente: restablecer contraseña con código ──────────────────────────
function PasoRestablecerContrasena({
  email,
  onVolver,
}: {
  email: string;
  onVolver: () => void;
}) {
  const { verificarCodigoRecuperacion, restablecerContrasena } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const t = await verificarCodigoRecuperacion(email, codigo.trim());
      setToken(t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setSubmitting(false);
    }
  };

  const onRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmacion) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      await restablecerContrasena(nuevaContrasena, token!);
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{token ? "Nueva contraseña" : "Introduce el código"}</CardTitle>
          <CardDescription>
            {token
              ? "Elige una nueva contraseña para tu cuenta."
              : `Introduce el código de 6 dígitos enviado a ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <form className="space-y-4" onSubmit={onVerificarCodigo}>
              <div className="space-y-2">
                <Label htmlFor="codigo-reset">Código de recuperación</Label>
                <Input
                  id="codigo-reset"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || codigo.length < 6}>
                {submitting ? "Verificando..." : "Verificar código"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={onVolver}>
                Volver
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onRestablecer}>
              <div className="space-y-2">
                <Label htmlFor="nueva-pass">Nueva contraseña</Label>
                <Input
                  id="nueva-pass"
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-pass">Confirmar contraseña</Label>
                <Input
                  id="confirmar-pass"
                  type="password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
