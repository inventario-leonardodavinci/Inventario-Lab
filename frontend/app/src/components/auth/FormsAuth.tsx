import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/ContextoAutenticacion";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AlertCircle } from "lucide-react";

// ─── Componente de alerta inline ─────────────────────────────────────────────

// ─── Componentes de feedback ──────────────────────────────────────────────────

/** Error de campo individual — aparece debajo del input */
function ErrorCampo({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="size-3 shrink-0" />
      {mensaje}
    </p>
  );
}

/** Error general del formulario — caja con fondo */
function AlertaError({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  );
}

function inputCls(tieneError: boolean) {
  return `h-11 rounded-xl transition-colors ${tieneError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`;
}

function TogglePassword({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      onClick={onToggle}
    >
      {show
        ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        : <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      }
    </button>
  );
}

const ICONO_GOOGLE = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ICONO_APPLE = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.4.83 3.23.87.96-.19 1.88-.97 3.17-.87 1.34.11 2.35.64 3.01 1.62-2.76 1.65-2.3 5.28.59 6.32-.57 1.56-1.32 3.1-2 3.94zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 rounded-r-2xl"
        style={{ background: "linear-gradient(135deg, hsl(212 85% 45%) 0%, hsl(212 85% 35%) 50%, hsl(222 47% 25%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="1.5">
                <circle cx="24" cy="24" r="22" opacity="0.3" />
                <path d="M24 10v28M17 18c0 0 3-4 7-4s7 4 7 4M14 28c0 0 5-5 10-5s10 5 10 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Inventario Lab</span>
              <p className="text-xs text-white/50 tracking-wide uppercase">Salud Ambiental</p>
            </div>
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-white tracking-tight">
            Inventario de<br />
            <span className="text-white/70 font-normal italic">Salud Ambiental</span>
          </h1>
        </div>
        <div className="relative z-10 space-y-4 max-w-sm">
          <p className="text-lg leading-relaxed text-white/70">
            Sistema integral para la gestión y seguimiento del inventario de recursos en salud ambiental.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <div className="w-8 h-px bg-white/30" />
            <span>Acceso seguro y verificado</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Branding visible en móvil (el panel izquierdo está oculto) */}
          <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-5 h-5 text-primary" stroke="currentColor" strokeWidth="1.5">
                <circle cx="24" cy="24" r="22" opacity="0.3" />
                <path d="M24 10v28M17 18c0 0 3-4 7-4s7 4 7 4M14 28c0 0 5-5 10-5s10 5 10 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Inventario Lab</p>
              <p className="text-xs text-muted-foreground">Salud Ambiental</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

interface AuthCardProps {
  titulo: string;
  descripcion?: string;
  icono: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ titulo, descripcion, icono, children }: AuthCardProps) {
  return (
    <Card className="shadow-xl border-border/50 auth-animate-fade-up lg:rounded-l-2xl">
      <CardHeader className="space-y-2 pb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
          {icono}
        </div>
        <CardTitle className="text-2xl tracking-tight">{titulo}</CardTitle>
        {descripcion && <CardDescription className="text-base">{descripcion}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function BotonesOAuth({ onOAuth, oAuthProviders }: { onOAuth: (p: string) => void; oAuthProviders: string[] }) {
  if (oAuthProviders.length === 0) return null;
  return (
    <div className="space-y-3 mb-5">
      <div className="flex flex-col gap-3">
        {oAuthProviders.map((provider) => {
          if (provider === "google") {
            return (
              <Button key={provider} type="button" variant="outline" className="w-full h-11 gap-2 font-normal rounded-xl" onClick={() => onOAuth(provider)}>
                {ICONO_GOOGLE} Continuar con Google
              </Button>
            );
          }
          if (provider === "apple") {
            return (
              <Button key={provider} type="button" className="w-full h-11 gap-2 font-normal rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 border-0" onClick={() => onOAuth(provider)}>
                {ICONO_APPLE} Continuar con Apple
              </Button>
            );
          }
          return null;
        })}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">o con correo</span>
        </div>
      </div>
    </div>
  );
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function VistaLogin({ onNavegar, oAuthProviders }: { onNavegar: (ruta: string) => void; oAuthProviders: string[] }) {
  const navigate = useNavigate();
  const { login, loginConOAuth } = useAuth();
  const [ultimoUsuario, setUltimoUsuario] = useState<{ nombre: string; email: string; avatarUrl: string } | null>(() => {
    try {
      const raw = localStorage.getItem("ultimo_usuario:v1");
      if (raw) {
        const datos = JSON.parse(raw) as { nombre: string; email: string; avatarUrl: string };
        return datos.email ? datos : null;
      }
    } catch { /* ignorar */ }
    return null;
  });
  const [email, setEmail] = useState(() => {
    try {
      const raw = localStorage.getItem("ultimo_usuario:v1");
      if (raw) {
        const datos = JSON.parse(raw) as { nombre: string; email: string; avatarUrl: string };
        return datos.email ?? "";
      }
    } catch { /* ignorar */ }
    return "";
  });
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function iniciales(nombre: string): string {
    return nombre.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  const validar = () => {
    const e: typeof errores = {};
    if (!email.trim()) e.email = "El correo es obligatorio";
    else if (!validarEmail(email)) e.email = "Introduce un correo válido";
    if (!password) e.password = "La contraseña es obligatoria";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      if (message.includes("verificar tu correo")) {
        navigate(`/login/verificar?email=${encodeURIComponent(email.trim())}`);
        toast.info("Tu cuenta no está verificada. Revisa tu correo e introduce el código.");
      } else {
        setErrores({ general: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onOAuth = async (provider: string) => {
    try { await loginConOAuth(provider); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error con el proveedor"); }
  };

  const onUsarOtraCuenta = () => { setUltimoUsuario(null); setEmail(""); setPassword(""); setErrores({}); };

  if (ultimoUsuario) {
    return (
      <AuthCard titulo="Bienvenido de nuevo" descripcion="Última sesión iniciada con esta cuenta."
        icono={
          <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="22" opacity="0.3" />
            <path d="M24 10v28M17 18c0 0 3-4 7-4s7 4 7 4M14 28c0 0 5-5 10-5s10 5 10 5" />
          </svg>
        }
      >
        <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 px-6 py-5">
          <div className="relative">
            {ultimoUsuario.avatarUrl
              ? <img src={ultimoUsuario.avatarUrl} alt={ultimoUsuario.nombre} className="size-16 rounded-full object-cover ring-4 ring-background shadow-md" />
              : <div className="size-16 rounded-full bg-primary/15 ring-4 ring-background shadow-md flex items-center justify-center text-xl font-bold text-primary">{iniciales(ultimoUsuario.nombre)}</div>
            }
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base">{ultimoUsuario.nombre}</p>
            <p className="text-sm text-muted-foreground">{ultimoUsuario.email}</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password-rapido" className="text-sm font-medium">Contraseña</Label>
              <button
                type="button"
                className="min-h-[36px] px-1 text-xs text-primary underline-offset-4 hover:underline"
                onClick={() => onNavegar("/login/recuperar")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Input id="password-rapido" type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setErrores({}); }}
                autoComplete="current-password" className={inputCls(!!errores.password)} autoFocus />
              <TogglePassword show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
            </div>
            <ErrorCampo mensaje={errores.password ?? ""} />
          </div>
          {errores.general && <AlertaError mensaje={errores.general} />}
          <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</Button>
          <Button type="button" variant="ghost" className="w-full h-10 text-sm font-normal rounded-xl text-muted-foreground" onClick={onUsarOtraCuenta}>Usar otra cuenta</Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Acceso al sistema" descripcion="Inicia sesión para ver inventario y notificaciones."
      icono={
        <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="22" opacity="0.3" />
          <path d="M24 10v28M17 18c0 0 3-4 7-4s7 4 7 4M14 28c0 0 5-5 10-5s10 5 10 5" />
        </svg>
      }
    >
      <BotonesOAuth onOAuth={onOAuth} oAuthProviders={oAuthProviders} />
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
          <Input id="email" type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: undefined, general: undefined })); }}
            placeholder="tu@correo.com" autoComplete="email" className={inputCls(!!errores.email)} />
          <ErrorCampo mensaje={errores.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
            <button
              type="button"
              className="min-h-[36px] px-1 text-xs text-primary underline-offset-4 hover:underline"
              onClick={() => onNavegar("/login/recuperar")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => { setPassword(e.target.value); setErrores((p) => ({ ...p, password: undefined, general: undefined })); }}
              placeholder="Tu contraseña"
              autoComplete="current-password" className={`${inputCls(!!errores.password)} pr-10`} />
            <TogglePassword show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </div>
          <ErrorCampo mensaje={errores.password ?? ""} />
        </div>
        {errores.general && <AlertaError mensaje={errores.general} />}
        <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</Button>
        <Button type="button" variant="outline" className="w-full h-11 rounded-xl font-normal" onClick={() => onNavegar("/login/registro")}>
          Crear una cuenta nueva
        </Button>
      </form>
    </AuthCard>
  );
}
export function VistaRegistro({ onNavegar, oAuthProviders }: { onNavegar: (ruta: string) => void; oAuthProviders: string[] }) {
  const navigate = useNavigate();
  const { registro, loginConOAuth } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<{ nombre?: string; email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validar = () => {
    const e: typeof errores = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!email.trim()) e.email = "El correo es obligatorio";
    else if (!validarEmail(email)) e.email = "Introduce un correo válido";
    if (!password) e.password = "La contraseña es obligatoria";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setSubmitting(true);
    try {
      const resultado = await registro(email.trim(), password, nombre.trim());
      if (resultado.tipo === "verificacion_requerida" || resultado.tipo === "email_ya_existe") {
        navigate(`/login/verificar?email=${encodeURIComponent(resultado.email)}`);
        toast.info("Revisa tu correo e introduce el código de 6 dígitos.");
      } else {
        navigate("/");
      }
    } catch (err) {
      setErrores({ general: err instanceof Error ? err.message : "Error al crear la cuenta" });
    } finally {
      setSubmitting(false);
    }
  };

  const onOAuth = async (provider: string) => {
    try { await loginConOAuth(provider); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error con el proveedor"); }
  };

  return (
    <AuthCard titulo="Crear cuenta" descripcion="Regístrate para acceder al sistema de inventario."
      icono={<svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>}
    >
      <BotonesOAuth onOAuth={onOAuth} oAuthProviders={oAuthProviders} />
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-sm font-medium">Nombre completo</Label>
          <Input id="nombre" type="text" value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
            placeholder="María García" autoComplete="name" className={inputCls(!!errores.nombre)} />
          <ErrorCampo mensaje={errores.nombre ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email-reg" className="text-sm font-medium">Correo electrónico</Label>
          <Input id="email-reg" type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: undefined, general: undefined })); }}
            placeholder="tu@correo.com" autoComplete="email" className={inputCls(!!errores.email)} />
          <ErrorCampo mensaje={errores.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password-reg" className="text-sm font-medium">Contraseña</Label>
          <Input id="password-reg" type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setErrores((p) => ({ ...p, password: undefined })); }}
            autoComplete="new-password" placeholder="Mínimo 6 caracteres" className={inputCls(!!errores.password)} />
          <ErrorCampo mensaje={errores.password ?? ""} />
        </div>
        {errores.general && <AlertaError mensaje={errores.general} />}
        <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting}>{submitting ? "Creando cuenta..." : "Crear cuenta"}</Button>
        <Button type="button" variant="ghost" className="w-full h-10 text-sm font-normal rounded-xl" onClick={() => onNavegar("/login")}>Ya tengo cuenta</Button>
      </form>
    </AuthCard>
  );
}

export function VistaVerificarEmail({ email, onNavegar }: { email: string; onNavegar: (ruta: string) => void }) {
  const navigate = useNavigate();
  const { verificarEmail, reenviarCodigo } = useAuth();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reenvioContador, setReenvioContador] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reenvioContador > 0) {
      timerRef.current = setInterval(() => {
        setReenvioContador((c) => { if (c <= 1 && timerRef.current) clearInterval(timerRef.current); return c - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reenvioContador]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verificarEmail(email, otp.trim());
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
      await reenviarCodigo(email);
      setReenvioContador(60);
      toast.success("Código reenviado. Revisa tu correo.");
    } catch {
      toast.error("No se pudo reenviar el código");
    }
  };

  return (
    <AuthCard
      titulo="Verifica tu correo"
      descripcion={`Hemos enviado un código de 6 dígitos a ${email}`}
      icono={
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 6L2 7" />
        </svg>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="size-12 text-lg" />
              <InputOTPSlot index={1} className="size-12 text-lg" />
              <InputOTPSlot index={2} className="size-12 text-lg" />
              <InputOTPSlot index={3} className="size-12 text-lg" />
              <InputOTPSlot index={4} className="size-12 text-lg" />
              <InputOTPSlot index={5} className="size-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting || otp.length < 6}>{submitting ? "Verificando..." : "Verificar"}</Button>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">¿No llegó el código?</span>
          <button type="button" className="text-primary font-medium underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 transition-opacity" onClick={onReenviar} disabled={reenvioContador > 0}>{reenvioContador > 0 ? `Reenviar en ${reenvioContador}s` : "Reenviar"}</button>
        </div>
        <Button type="button" variant="ghost" className="w-full h-10 text-sm font-normal rounded-xl" onClick={() => onNavegar("/login")}>Volver al inicio de sesión</Button>
      </form>
    </AuthCard>
  );
}

export function VistaRecuperar({ onNavegar }: { onNavegar: (ruta: string) => void }) {
  const { enviarCodigoRecuperacion } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validarEmail(email)) { setError("Ingresa un correo electrónico válido"); return; }
    setSubmitting(true);
    try {
      await enviarCodigoRecuperacion(email.trim());
      onNavegar(`/login/restablecer?email=${encodeURIComponent(email.trim())}`);
      toast.info("Si existe una cuenta con ese correo, recibirás un código para restablecer tu contraseña.");
    } catch {
      onNavegar(`/login/restablecer?email=${encodeURIComponent(email.trim())}`);
      toast.info("Si existe una cuenta con ese correo, recibirás un código para restablecer tu contraseña.");
    }
  };

  return (
    <AuthCard
      titulo="Recuperar contraseña"
      descripcion="Introduce tu correo y te enviaremos un código para restablecer tu contraseña."
      icono={
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email-recuperar" className="text-sm font-medium">Correo electrónico</Label>
          <Input id="email-recuperar" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="tu@correo.com" required autoComplete="email" className="h-11 rounded-xl" />
          {error && <AlertaError mensaje={error} />}
        </div>
        <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting}>{submitting ? "Enviando..." : "Enviar código"}</Button>
        <Button type="button" variant="ghost" className="w-full h-10 text-sm font-normal rounded-xl" onClick={() => onNavegar("/login")}>Volver al inicio de sesión</Button>
      </form>
    </AuthCard>
  );
}

export function VistaRestablecer({ email, onNavegar }: { email: string; onNavegar: (ruta: string) => void }) {
  const { verificarCodigoRecuperacion, restablecerContrasena } = useAuth();
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
    if (nuevaContrasena !== confirmacion) { toast.error("Las contraseñas no coinciden"); return; }
    if (nuevaContrasena.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setSubmitting(true);
    try {
      await restablecerContrasena(nuevaContrasena, token!);
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      onNavegar("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      titulo={token ? "Nueva contraseña" : "Introduce el código"}
      descripcion={token ? "Elige una nueva contraseña para tu cuenta." : `Introduce el código de 6 dígitos enviado a ${email}.`}
      icono={
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      }
    >
      {!token ? (
        <form className="space-y-5" onSubmit={onVerificarCodigo}>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={codigo} onChange={setCodigo} autoFocus>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-12 text-lg" />
                <InputOTPSlot index={1} className="size-12 text-lg" />
                <InputOTPSlot index={2} className="size-12 text-lg" />
                <InputOTPSlot index={3} className="size-12 text-lg" />
                <InputOTPSlot index={4} className="size-12 text-lg" />
                <InputOTPSlot index={5} className="size-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting || codigo.length < 6}>{submitting ? "Verificando..." : "Verificar código"}</Button>
          <Button type="button" variant="ghost" className="w-full h-10 text-sm font-normal rounded-xl" onClick={() => onNavegar("/login/recuperar")}>Volver</Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={onRestablecer}>
          <div className="space-y-2">
            <Label htmlFor="nueva-pass" className="text-sm font-medium">Nueva contraseña</Label>
            <Input id="nueva-pass" type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} required autoComplete="new-password" minLength={6} placeholder="Mínimo 6 caracteres" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-pass" className="text-sm font-medium">Confirmar contraseña</Label>
            <Input id="confirmar-pass" type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required autoComplete="new-password" minLength={6} placeholder="Repite la contraseña" className="h-11 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl font-normal" disabled={submitting}>{submitting ? "Guardando..." : "Guardar contraseña"}</Button>
        </form>
      )}
    </AuthCard>
  );
}
