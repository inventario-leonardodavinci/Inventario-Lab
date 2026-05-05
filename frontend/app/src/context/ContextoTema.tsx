import { createContext, useContext, useEffect, useState } from 'react'

type Tema = 'light' | 'dark' | 'system'

type ContextoTemaType = {
  tema: Tema
  temaEfectivo: 'light' | 'dark'
  setTema: (tema: Tema) => void
}

const ContextoTema = createContext<ContextoTemaType | undefined>(undefined)

const CLAVE_STORAGE = 'inventario-tema'

function resolverTemaEfectivo(t: Tema): 'light' | 'dark' {
  if (t !== 'system') return t
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicarClase(efectivo: 'light' | 'dark') {
  const raiz = document.documentElement
  raiz.classList.remove('light', 'dark')
  raiz.classList.add(efectivo)
}

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTemaInterno] = useState<Tema>(() => {
    const guardado = localStorage.getItem(CLAVE_STORAGE)
    if (guardado === 'light' || guardado === 'dark' || guardado === 'system') {
      return guardado
    }
    return 'system'
  })

  const [temaEfectivo, setTemaEfectivo] = useState<'light' | 'dark'>(() =>
    resolverTemaEfectivo(tema === 'system' ? 'system' : tema),
  )

  // Aplicar clase en <html> al montar y cuando cambia el tema
  useEffect(() => {
    aplicarClase(temaEfectivo)
  }, [temaEfectivo])

  // Escuchar preferencia del sistema cuando tema === 'system'
  useEffect(() => {
    if (tema !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const manejar = () => {
      const efectivo = media.matches ? 'dark' : 'light'
      setTemaEfectivo(efectivo)
      aplicarClase(efectivo)
    }
    media.addEventListener('change', manejar)
    return () => media.removeEventListener('change', manejar)
  }, [tema])

  function setTema(nuevoTema: Tema) {
    localStorage.setItem(CLAVE_STORAGE, nuevoTema)
    const efectivo = resolverTemaEfectivo(nuevoTema)
    setTemaEfectivo(efectivo)
    aplicarClase(efectivo)   // aplicar inmediatamente sin esperar al render
    setTemaInterno(nuevoTema)
  }

  return (
    <ContextoTema.Provider value={{ tema, temaEfectivo, setTema }}>
      {children}
    </ContextoTema.Provider>
  )
}

export function useTema() {
  const ctx = useContext(ContextoTema)
  if (!ctx) throw new Error('useTema debe usarse dentro de ProveedorTema')
  return ctx
}
