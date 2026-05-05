import { Moon, Sun } from 'lucide-react'
import { useTema } from '@/context/ContextoTema'
import { Button } from '@/components/ui/button'

export function BotonTema() {
  const { temaEfectivo, setTema } = useTema()

  function alternar() {
    setTema(temaEfectivo === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label={temaEfectivo === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={alternar}
    >
      {temaEfectivo === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}
