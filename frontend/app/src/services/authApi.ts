import { insforge } from "./insforgeClient";

export type CredencialesLogin = {
  email: string;
  password: string;
};

export type SesionUsuario = {
  authUserId: string;
  displayName: string;
  role: "admin" | "tecnico" | "consulta";
};

export type ConfiguracionAuth = {
  requireEmailVerification: boolean;
  passwordMinLength: number;
  verifyEmailMethod: "code" | "link";
  resetPasswordMethod: "code" | "link";
  oAuthProviders: string[];
};

// ─── Configuración pública ────────────────────────────────────────────────────

export async function obtenerConfigAuth(): Promise<ConfiguracionAuth> {
  const res = await fetch(
    `${import.meta.env.VITE_INSFORGE_URL}/api/auth/public-config`,
  );
  if (!res.ok) throw new Error("No se pudo obtener la configuración de auth");
  return res.json() as Promise<ConfiguracionAuth>;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function extraerSesion(user: {
  id: string;
  email?: string;
  name?: string;
  user_metadata?: Record<string, unknown>;
}): SesionUsuario {
  const authUserId = user.id;
  const meta = user.user_metadata ?? {};

  // Orden de prioridad para el nombre:
  // 1. display_name guardado explícitamente (registro con email)
  // 2. full_name de Google/Apple OAuth
  // 3. name de Google/Apple OAuth
  // 4. user.name del SDK (puede ser email en algunos proveedores — lo filtramos)
  // 5. Parte local del email (antes del @)
  // 6. Fallback "Usuario"
  const candidatos = [
    meta.display_name as string | undefined,
    meta.full_name as string | undefined,
    meta.name as string | undefined,
  ].filter((v): v is string => typeof v === "string" && v.length > 0 && !v.includes("@"));

  // user.name solo si no parece un email
  if (typeof user.name === "string" && user.name.length > 0 && !user.name.includes("@")) {
    candidatos.push(user.name);
  }

  // Parte local del email como último recurso legible
  if (user.email) {
    const parteLocal = user.email.split("@")[0];
    if (parteLocal) candidatos.push(parteLocal);
  }

  const displayName = candidatos[0] ?? "Usuario";

  const role =
    (meta.role as "admin" | "tecnico" | "consulta") ?? "consulta";

  return { authUserId, displayName, role };
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
    throw new Error(error.message ?? "Credenciales incorrectas");
  }

  if (!data?.user) throw new Error("No se recibió información del usuario");
  return extraerSesion(data.user);
}

// ─── Registro ─────────────────────────────────────────────────────────────────

export type ResultadoRegistro =
  | { tipo: "verificacion_requerida"; email: string }
  | { tipo: "sesion_iniciada"; sesion: SesionUsuario };

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

  if (error) throw new Error(error.message ?? "Error al crear la cuenta");

  if (data?.requireEmailVerification) {
    return { tipo: "verificacion_requerida", email };
  }

  if (data?.accessToken && data.user) {
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
    redirectTo: `${window.location.origin}/restablecer-contrasena`,
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

// Sincroniza el display_name del usuario con el backend Laravel
// Se llama en cada login para que usuarios OAuth tengan su nombre real
export async function sincronizarPerfil(authUserId: string, displayName: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
  await fetch(`${baseUrl}/perfil`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-User-Id": authUserId,
    },
    body: JSON.stringify({ display_name: displayName }),
  });
  // Ignoramos errores — si falla, el nombre queda como "Usuario" por defecto
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
