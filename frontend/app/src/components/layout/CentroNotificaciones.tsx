import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/ContextoAutenticacion";
import { getNotificaciones, type NotificacionItem } from "@/services/notificacionesApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CentroNotificaciones() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!user) return;
    getNotificaciones(user.authUserId)
      .then((response) => {
        setNotificaciones(response.data);
        setNoLeidas(response.unread_count);
      })
      .catch(() => {
        setNotificaciones([]);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((current) => !current)}>
        <Bell />
        {noLeidas > 0 && <Badge variant="destructive">{noLeidas}</Badge>}
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-96 rounded-md border bg-background p-3 shadow-md">
          <p className="mb-2 text-sm font-semibold">Notificaciones</p>
          {notificaciones.length === 0 && <p className="text-sm text-muted-foreground">Sin notificaciones.</p>}
          <div className="space-y-2">
            {notificaciones.map((notificacion) => (
              <div key={notificacion.id} className="rounded border p-2">
                <p className="text-sm font-medium">{notificacion.title}</p>
                <p className="text-xs text-muted-foreground">{notificacion.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
