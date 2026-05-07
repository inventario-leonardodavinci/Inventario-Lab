import { Inbox } from "@novu/react";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useEffect, useState } from "react";

function useTemaColores() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function CentroNotificaciones() {
  const { user } = useAuth();
  const isDark = useTemaColores();

  if (!user) return null;

  return (
    <Inbox
      applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER}
      subscriberId={user.authUserId}
      appearance={{
        variables: isDark ? {
          colorBackground: "hsl(224 71% 4%)",
          colorForeground: "hsl(213 31% 91%)",
          colorPrimary: "hsl(212 85% 60%)",
          colorPrimaryForeground: "hsl(0 0% 100%)",
          colorSecondary: "hsl(223 47% 11%)",
          colorSecondaryForeground: "hsl(212 85% 70%)",
          colorNeutral: "hsl(215 28% 17%)",
          colorShadow: "hsl(0 0% 0% / 0.4)",
          fontSize: "14px",
        } : {
          colorBackground: "hsl(0 0% 100%)",
          colorForeground: "hsl(222 47% 11%)",
          colorPrimary: "hsl(212 85% 55%)",
          colorPrimaryForeground: "hsl(0 0% 100%)",
          colorSecondary: "hsl(214 30% 94%)",
          colorSecondaryForeground: "hsl(212 85% 40%)",
          colorNeutral: "hsl(214 30% 88%)",
          colorShadow: "hsl(222 47% 11% / 0.08)",
          fontSize: "14px",
        },
        elements: {
          bellIcon: {
            color: isDark ? "hsl(215 16% 65%)" : "hsl(215 16% 47%)",
          },
        },
      }}
    />
  );
}
