import { insforge } from "./insforgeClient";

export type CredencialesLogin = {
  email: string;
  password: string;
};

export type SesionUsuario = {
  authUserId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl?: string;
  role: "administrador" | "profesor" | "consultor" | "admin" | "tecnico" | "consulta";
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ConfiguracionAuth = {
  requireEmailVerification: boolean;
  passwordMinLength: number;
  verifyEmailMethod: "code" | "link";
  resetPasswordMethod: "code" | "link";
  oAuthProviders: string[];
};

// ─── Configuración pública ────────────────────────────────────────────────────

// Valores por defecto basados en la config real del proyecto
const CONFIG_DEFECTO: ConfiguracionAuth = {
  requireEmailVerification: true,
  passwordMinLength: 6,
  verifyEmailMethod: "code",
  resetPasswordMethod: "code",
  oAuthProviders: ["google", "apple"],
};

export async function obtenerConfigAuth(): Promise<ConfiguracionAuth> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_INSFORGE_URL}/api/auth/public-config`,
    );
    if (!res.ok) return CONFIG_DEFECTO;
    const data = await res.json() as Partial<ConfiguracionAuth>;
    // Mezclar con defaults por si faltan campos
    return { ...CONFIG_DEFECTO, ...data };
  } catch {
    return CONFIG_DEFECTO;
  }
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function extraerSesion(user: {
  id: string;
  email?: string;
  name?: string;
  user_metadata?: Record<string, unknown>;
  // Estructura real de Insforge
  profile?: { name?: string; avatar_url?: string } | null;
  metadata?: Record<string, unknown> | null;
  emailVerified?: boolean;
  createdAt?: string;
}): SesionUsuario {
  const authUserId = user.id;
  const meta = user.metadata ?? user.user_metadata ?? {};

  // Insforge pone el nombre en `profile.name`
  const profileName = user.profile?.name;
  const avatarUrl = user.profile?.avatar_url;

  const candidatos = [
    meta.display_name as string | undefined,
    profileName,
    meta.full_name as string | undefined,
    meta.name as string | undefined,
  ].filter((v): v is string => typeof v === "string" && v.length > 0 && !v.includes("@"));

  // user.name del SDK como fallback
  if (typeof user.name === "string" && user.name.length > 0 && !user.name.includes("@")) {
    candidatos.push(user.name);
  }

  // Parte local del email como último recurso
  if (user.email) {
    const parteLocal = user.email.split("@")[0];
    if (parteLocal) candidatos.push(parteLocal);
  }

  const displayName = candidatos[0] ?? "Usuario";

  const role =
    (meta.role as SesionUsuario["role"]) ?? "consultor";

  return {
    authUserId,
    email: user.email ?? "",
    emailVerified: user.emailVerified ?? false,
    displayName,
    avatarUrl,
    role,
    createdAt: user.createdAt ?? "",
    metadata: meta as Record<string, unknown>,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginConInsforge(
  credenciales: CredencialesLogin,
): Promise<SesionUsuario> {
  const { data, error } = await insforge.auth.signInWithPassword({
    email: credenciales.email,
    password: credenciales.password,
  });

  if (error) {
    if (error.statusCode === 403) {
      throw new Error(
        "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
      );
    }
    const mensaje = error.message ?? "";
    if (mensaje.toLowerCase().includes("invalid") || mensaje.toLowerCase().includes("credentials")) {
      throw new Error("Correo o contraseña incorrectos");
    }
    throw new Error(mensaje || "Credenciales incorrectas");
  }

  if (!data?.user) {
    throw new Error("No se recibió información del usuario");
  }
  return extraerSesion(data.user);
}

// ─── Registro ─────────────────────────────────────────────────────────────────

export type ResultadoRegistro =
  | { tipo: "verificacion_requerida"; email: string }
  | { tipo: "sesion_iniciada"; sesion: SesionUsuario }
  | { tipo: "email_ya_existe"; email: string };

export async function registrarUsuario(
  email: string,
  password: string,
  displayName: string,
): Promise<ResultadoRegistro> {
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name: displayName,
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) {
    const mensaje = error.message?.toLowerCase() ?? "";
    if (mensaje.includes("already") || mensaje.includes("existe") || mensaje.includes("exists")) {
      return { tipo: "email_ya_existe", email };
    }
    const msg = error.message ?? "Error al crear la cuenta";
    if (msg.toLowerCase().includes("password") && msg.toLowerCase().includes("length")) {
      throw new Error(`La contraseña debe tener al menos ${import.meta.env.VITE_PASSWORD_MIN_LENGTH || 6} caracteres`);
    }
    throw new Error(msg);
  }

  // Insforge puede devolver el user directamente o dentro de { user, ... }
  if (data?.requireEmailVerification) {
    return { tipo: "verificacion_requerida", email };
  }

  if (data?.accessToken && data?.user?.id) {
    return { tipo: "sesion_iniciada", sesion: extraerSesion(data.user) };
  }

  // Fallback: verificación requerida sin flag explícito
  return { tipo: "verificacion_requerida", email };
}

// ─── Verificación de email (código OTP) ───────────────────────────────────────

export async function verificarEmail(
  email: string,
  otp: string,
): Promise<SesionUsuario> {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });

  if (error) {
    if (error.statusCode === 400) {
      throw new Error("Código incorrecto o expirado. Solicita uno nuevo.");
    }
    throw new Error(error.message ?? "Error al verificar el código");
  }

  if (!data?.user) throw new Error("No se recibió información del usuario");
  return extraerSesion(data.user);
}

export async function reenviarCodigoVerificacion(email: string): Promise<void> {
  await insforge.auth.resendVerificationEmail({
    email,
    redirectTo: `${window.location.origin}/login`,
  });
}

// ─── Recuperación de contraseña (código OTP) ──────────────────────────────────

export async function enviarCodigoRecuperacion(email: string): Promise<void> {
  await insforge.auth.sendResetPasswordEmail({
    email,
    redirectTo: `${window.location.origin}/login`,
  });
}

export async function verificarCodigoRecuperacion(
  email: string,
  code: string,
): Promise<string> {
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({
    email,
    code,
  });

  if (error) throw new Error(error.message ?? "Código incorrecto o expirado");
  return (data?.token ?? "") as string;
}

export async function restablecerContrasena(
  nuevaContrasena: string,
  token: string,
): Promise<void> {
  const { error } = await insforge.auth.resetPassword({
    newPassword: nuevaContrasena,
    otp: token,
  });

  if (error) throw new Error(error.message ?? "Error al restablecer la contraseña");
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export async function loginConOAuth(
  provider: string,
  redirectTo: string,
): Promise<void> {
  await insforge.auth.signInWithOAuth({ provider, redirectTo });
}

// ─── Sesión ───────────────────────────────────────────────────────────────────

export async function obtenerSesionActual(): Promise<SesionUsuario | null> {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;

  return extraerSesion(data.user);
}

export async function logoutDeInsforge(): Promise<void> {
  await insforge.auth.signOut();
}

// Sincroniza el nombre visible del usuario con el backend Laravel
export async function sincronizarPerfil(authUserId: string, displayName: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${baseUrl}/perfil`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-User-Id": authUserId,
      },
      body: JSON.stringify({ nombre_visible: displayName }),
      signal: controller.signal,
    });
  } catch {
    // Silencioso
  } finally {
    clearTimeout(timeout);
  }
}

// Obtiene el rol real del usuario desde el backend Laravel
export async function obtenerRolDesdeBackend(authUserId: string): Promise<SesionUsuario["role"] | null> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  try {
    const res = await fetch(`${baseUrl}/perfil`, {
      headers: { "X-Auth-User-Id": authUserId },
    });
    if (!res.ok) return null;
    const data = await res.json() as { roles?: { name: string }[] };
    const primerRol = data.roles?.[0]?.name;
    return (primerRol as SesionUsuario["role"]) ?? null;
  } catch {
    return null;
  }
}

// Actualiza el nombre en Insforge y en el backend Laravel
export async function actualizarNombreUsuario(
  authUserId: string,
  nuevoNombre: string,
): Promise<void> {
  // 1. Actualizar en Insforge
  const { error } = await insforge.auth.setProfile({ name: nuevoNombre });
  if (error) throw new Error(error.message ?? "Error al actualizar el nombre");

  // 2. Sincronizar con el backend Laravel
  await sincronizarPerfil(authUserId, nuevoNombre);
}

// Obtiene el email del usuario actual desde Insforge
export async function obtenerEmailUsuario(): Promise<string | null> {
  const { data } = await insforge.auth.getCurrentUser();
  return data?.user?.email ?? null;
}

// Obtiene el usuario completo desde Insforge para la página de perfil
export async function obtenerUsuarioCompleto(): Promise<{
  id: string;
  email: string;
  emailVerified: boolean;
  profile: { name?: string; avatar_url?: string } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
} | null> {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;

  const user = data.user;
  return {
    id: user.id ?? "",
    email: user.email ?? "",
    emailVerified: user.emailVerified ?? false,
    profile: user.profile ?? null,
    metadata: user.metadata ?? null,
    createdAt: user.createdAt ?? "",
    updatedAt: user.updatedAt ?? "",
  };
}

// Actualiza un campo específico del perfil en Insforge
export async function actualizarCampoPerfil(
  campo: string,
  valor: string | unknown,
): Promise<void> {
  const { error } = await insforge.auth.setProfile({ [campo]: valor });
  if (error) throw new Error(error.message ?? `Error al actualizar ${campo}`);
}
