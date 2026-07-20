export function formatarDataHora(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatarData(iso: string) {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}
