// Formatação de datas e números em português de Moçambique
const fmtData = new Intl.DateTimeFormat('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDataHora = new Intl.DateTimeFormat('pt-MZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtNum = new Intl.NumberFormat('pt-MZ')

export const formatarData = (iso) => (iso ? fmtData.format(new Date(iso)) : '—')
export const formatarDataHora = (iso) => (iso ? fmtDataHora.format(new Date(iso)) : '—')
export const formatarNumero = (n) => (n == null ? '—' : fmtNum.format(n))

export function tempoRelativo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora mesmo'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  return `há ${Math.floor(s / 86400)} dia(s)`
}
