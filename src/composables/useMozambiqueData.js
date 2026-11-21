// Acesso a dados públicos de Moçambique (requisito R2). Todos os pedidos usam fetch(),
// têm estados de carregamento/erro e guardam cache para não repetir pedidos (dados móveis caros).
//  1) Limites das 11 províncias — GeoJSON (Natural Earth) em public/dados/limites_mocambique.geojson
//  2) Distritos por província — public/dados/distritos.json
//  3) Geocodificação OpenStreetMap Nominatim, limitada a Moçambique (countrycodes=mz)
import { ref, computed } from 'vue'

const BASE = import.meta.env.BASE_URL

// ---------- estado partilhado ----------
const geojson = ref(null)
const distritosPorProvincia = ref({})
const aCarregarGeo = ref(false)
const erroDados = ref(null)
let promessaGeo = null
let promessaDistritos = null


async function obterJson(url, opcoes) {
  const resp = await fetch(url, opcoes)
  if (!resp.ok) throw new Error(`Pedido falhou (HTTP ${resp.status})`)
  return resp.json()
}

function carregarProvincias() {
  if (geojson.value) return Promise.resolve(geojson.value)
  if (!promessaGeo) {
    aCarregarGeo.value = true
    promessaGeo = obterJson(`${BASE}dados/limites_mocambique.geojson`)
      .then((g) => {
        if (!g?.features?.length) throw new Error('Ficheiro de limites vazio')
        geojson.value = g
        return g
      })
      .catch((e) => {
        console.error('[dados MZ] limites', e)
        erroDados.value = 'Não foi possível carregar os limites das províncias de Moçambique.'
        promessaGeo = null
        return null
      })
      .finally(() => { aCarregarGeo.value = false })
  }
  return promessaGeo
}

function carregarDistritos() {
  if (Object.keys(distritosPorProvincia.value).length) return Promise.resolve(distritosPorProvincia.value)
  if (!promessaDistritos) {
    promessaDistritos = obterJson(`${BASE}dados/distritos.json`)
      .then((d) => { distritosPorProvincia.value = d.provincias || {}; return d.provincias })
      .catch((e) => {
        console.error('[dados MZ] distritos', e)
        erroDados.value = 'Não foi possível carregar a lista de distritos.'
        promessaDistritos = null
        return {}
      })
  }
  return promessaDistritos
}

// ---------- geometria: ponto dentro de polígono (ray casting) ----------
function dentroDoAnel(lng, lat, anel) {
  let dentro = false
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]
    const [xj, yj] = anel[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}
function dentroDoPoligono(lng, lat, poligono) {
  if (!dentroDoAnel(lng, lat, poligono[0])) return false
  for (let k = 1; k < poligono.length; k++) if (dentroDoAnel(lng, lat, poligono[k])) return false
  return true
}

function provinciaDoPonto(lat, lng) {
  const g = geojson.value
  if (!g) return null
  for (const f of g.features) {
    const { type, coordinates } = f.geometry
    const poligonos = type === 'Polygon' ? [coordinates] : coordinates
    if (poligonos.some((p) => dentroDoPoligono(lng, lat, p))) return f.properties.nome
  }
  // Os limites são simplificados: aceita pontos muito perto da costa/fronteira (≈ 15 km)
  let melhor = null
  let menor = Infinity
  for (const f of g.features) {
    const [clat, clng] = f.properties.centro
    const d = Math.hypot(clat - lat, clng - lng)
    if (d < menor) { menor = d; melhor = f }
  }
  return dentroDaCaixa(lat, lng, 0.15) && menor < 4 ? melhor.properties.nome : null
}

// Caixa envolvente de Moçambique (com margem em graus)
function dentroDaCaixa(lat, lng, margem = 0) {
  return lat >= -26.9 - margem && lat <= -10.4 + margem && lng >= 30.2 - margem && lng <= 40.9 + margem
}

// ---------- Nominatim (OpenStreetMap) ----------
const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(distrito|cidade|municipio) d[eao]s? /, '')
const cacheGeo = new Map()

async function geocodificarInverso(lat, lng) {
  const chave = `${lat.toFixed(4)},${lng.toFixed(4)}`
  if (cacheGeo.has(chave)) return cacheGeo.get(chave)
  try {
    const r = await obterJson(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1&accept-language=pt`
    )
    const a = r.address || {}
    const provincia = provinciaDoPonto(lat, lng)
    const lista = distritosPorProvincia.value[provincia] || []
    const candidatos = [a.city_district, a.county, a.state_district, a.municipality, a.city, a.town, a.suburb]
    const distrito = lista.find((d) => candidatos.some((c) => c && normalizar(c).includes(normalizar(d)))) || null
    const localidade = [a.road, a.neighbourhood || a.suburb || a.quarter || a.village || a.hamlet].filter(Boolean).join(', ') || null
    const res = { distrito, localidade }
    cacheGeo.set(chave, res)
    return res
  } catch (e) {
    console.warn('[Nominatim] inverso', e)
    return null
  }
}

async function pesquisarLocal(texto) {
  const q = texto.trim()
  if (q.length < 3) return []
  const r = await obterJson(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=mz&limit=6&accept-language=pt&q=${encodeURIComponent(q)}`
  )
  return r.map((x) => ({ nome: x.display_name, lat: Number(x.lat), lng: Number(x.lon), caixa: x.boundingbox?.map(Number) }))
}

export function useMozambiqueData() {
  const provincias = computed(() =>
    geojson.value ? geojson.value.features.map((f) => f.properties.nome).sort((a, b) => a.localeCompare(b, 'pt')) : Object.keys(distritosPorProvincia.value).sort()
  )
  const distritosDe = (provincia) => distritosPorProvincia.value[provincia] || []
  const limitesDe = (provincia) => geojson.value?.features.find((f) => f.properties.nome === provincia) || null

  return {
    geojson, provincias, distritosDe, limitesDe, aCarregarGeo, erroDados,
    carregarProvincias, carregarDistritos, provinciaDoPonto, dentroDaCaixa,
    geocodificarInverso, pesquisarLocal
  }
}
