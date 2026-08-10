import { useState } from 'react'
import type { LocalizacaoGPS } from '../../lib/types'
import { Button } from './Button'
import { toast } from '../../store/toastStore'

export function LocationPicker({
  value,
  onChange,
}: {
  value?: LocalizacaoGPS
  onChange: (loc: LocalizacaoGPS | null) => void
}) {
  const [loading, setLoading] = useState(false)

  function capturar() {
    if (!navigator.geolocation) {
      toast({ variant: 'error', title: 'Localização indisponível', description: 'Este dispositivo não suporta GPS.' })
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precisao: pos.coords.accuracy,
          capturadaEm: new Date().toISOString(),
        })
        setLoading(false)
        toast({ variant: 'success', title: 'Localização capturada' })
      },
      () => {
        setLoading(false)
        toast({ variant: 'error', title: 'Não foi possível obter a localização', description: 'Verifique as permissões de GPS.' })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const mapSrc = value
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${value.longitude - 0.01}%2C${value.latitude - 0.01}%2C${value.longitude + 0.01}%2C${value.latitude + 0.01}&layer=mapnik&marker=${value.latitude}%2C${value.longitude}`
    : null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={capturar} loading={loading}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Capturar localização GPS
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remover
          </Button>
        )}
      </div>

      {value && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-brand-lite">
            Lat: {value.latitude.toFixed(6)} · Lng: {value.longitude.toFixed(6)}
            {value.precisao && ` · Precisão ±${Math.round(value.precisao)}m`}
          </p>
          {mapSrc && (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="Mapa da localização"
                src={mapSrc}
                className="h-56 w-full [filter:invert(0.92)_hue-rotate(180deg)_brightness(0.95)_contrast(0.9)]"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
