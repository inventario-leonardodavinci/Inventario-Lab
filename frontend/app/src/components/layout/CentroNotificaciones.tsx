import { Inbox } from "@novu/react";
import { useAuth } from "@/context/ContextoAutenticacion";

export function CentroNotificaciones() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Inbox
      applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER}
      subscriberId={user.authUserId}
      appearance={{
        variables: {
          colorBackground: "hsl(0 0% 100%)",
          colorForeground: "hsl(222 47% 11%)",
          colorPrimary: "hsl(212 85% 55%)",
          colorPrimaryForeground: "hsl(0 0% 100%)",
          colorSecondary: "hsl(214 30% 90%)",
          colorSecondaryForeground: "hsl(212 85% 40%)",
          colorNeutral: "hsl(214 30% 88%)",
          colorShadow: "hsl(222 47% 11% / 0.08)",
          fontSize: "14px",
        },
        elements: {
          bellIcon: {
            color: "hsl(215 16% 47%)",
          },
        },
      }}
    />
  );
}
