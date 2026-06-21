import { useState, useEffect } from 'react'

const LOGO_URL = 'http://localhost:5000/uploads/empresa-logo.png'

export function useEmpresaLogo() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setLogoSrc(LOGO_URL)
    img.onerror = () => setLogoSrc(null)
    img.src = `${LOGO_URL}?t=${Date.now()}`
  }, [])

  return logoSrc
}
