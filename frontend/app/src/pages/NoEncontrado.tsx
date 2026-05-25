import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NoEncontrado() {
  const navigate = useNavigate()

  return (
    <main className="animate-page-enter flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/20 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/20">
          <FileQuestion className="size-10 text-white" />
        </div>
        <h1 className="mt-4 text-7xl font-extrabold tracking-tight text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Página no encontrada
        </p>
        <p className="max-w-sm text-sm text-muted-foreground/70">
          La ruta a la que intentas acceder no existe o ha sido movida.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 size-4" />
          Volver atrás
        </Button>
        <Button size="sm" onClick={() => navigate('/')}>
          <Home className="mr-1.5 size-4" />
          Ir al inicio
        </Button>
      </div>
    </main>
  )
}
