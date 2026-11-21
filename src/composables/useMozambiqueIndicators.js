// Indicadores de contexto de Moçambique (população, estradas, água e electricidade).
// Os valores NUNCA estão escritos nos componentes: vêm de APIs públicas, por fetch():
//  - API do Banco Mundial (api.worldbank.org) — população, urbano/rural, água e electricidade (total, urbano e rural)
//  - API dos ODS da ONU (unstats.un.org) — indicador 9.1.1, Rural Access Index (RAI)
//    com recurso ao dataset local public/dados/acesso_rural_estradas.json se a API não responder.
// Cache de 24 h no navegador para poupar dados móveis.
import { ref, computed } from 'vue'

const WB = 'https://api.worldbank.org/v2/country/MOZ/indicator'
const CHAVE_CACHE = 'viaalerta-indicadores-moz-v2'
const VALIDADE = 24 * 60 * 60 * 1000

export const INDICADORES_WB = {
  populacao: { codigo: 'SP.POP.TOTL', nome: 'População total', unidade: 'habitantes' },
  urbana: { codigo: 'SP.URB.TOTL.IN.ZS', nome: 'População urbana', unidade: '% da população' },
  rural: { codigo: 'SP.RUR.TOTL.ZS', nome: 'População rural', unidade: '% da população' },
  electricidade: { codigo: 'EG.ELC.ACCS.ZS', nome: 'Acesso à electricidade', unidade: '% da população' },
  electricidadeUrbana: { codigo: 'EG.ELC.ACCS.UR.ZS', nome: 'Acesso à electricidade (urbano)', unidade: '% da população urbana' },
  electricidadeRural: { codigo: 'EG.ELC.ACCS.RU.ZS', nome: 'Acesso à electricidade (rural)', unidade: '% da população rural' },
  agua: { codigo: 'SH.H2O.BASW.ZS', nome: 'Serviço básico de água potável', unidade: '% da população' },
  aguaUrbana: { codigo: 'SH.H2O.BASW.UR.ZS', nome: 'Serviço básico de água (urbano)', unidade: '% da população urbana' },
  aguaRural: { codigo: 'SH.H2O.BASW.RU.ZS', nome: 'Serviço básico de água (rural)', unidade: '% da população rural' }
}

const linkWB = (codigo) => `https://data.worldbank.org/indicator/${codigo}?locations=MZ`

const dados = ref({})
const aCarregar = ref(false)
const erro = ref(null)
const atualizadoEm = ref(null)
let promessa = null

async function obterJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// Último valor disponível (mrnev=1) — se o ano mais recente não tiver dados, usa o anterior
async function indicadorWB(chave) {
  const ind = INDICADORES_WB[chave]
  const r = await obterJson(`${WB}/${ind.codigo}?format=json&mrnev=1`)
  const linha = Array.isArray(r) && Array.isArray(r[1]) ? r[1][0] : null
  if (!linha || linha.value == null) return null
  return { ...ind, chave, valor: Number(linha.value), ano: Number(linha.date), fonte: 'Banco Mundial', link: linkWB(ind.codigo) }
}

// ODS 9.1.1 — Rural Access Index: API da ONU, com recurso ao dataset local
async function acessoEstradas() {
  const base = { chave: 'estradas', codigo: 'SDG 9.1.1 (SP_ROD_R2KM)', nome: 'Acesso a estradas transitáveis', unidade: '% da população rural a menos de 2 km' }
  try {
    const r = await obterJson('https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode=SP_ROD_R2KM&areaCode=508&pageSize=50')
    const linhas = (r.data || []).filter((d) => d.value != null && d.value !== 'NaN')
    if (linhas.length) {
      const ultima = linhas.sort((a, b) => Number(b.timePeriodStart) - Number(a.timePeriodStart))[0]
      return { ...base, valor: Number(ultima.value), ano: Number(ultima.timePeriodStart), fonte: 'Nações Unidas — Base de dados dos ODS', link: 'https://unstats.un.org/sdgs/dataportal/countryprofiles/MOZ' }
    }
  } catch (e) {
    console.info('[ODS 9.1.1] API da ONU indisponível, a usar o dataset local:', e.message)
  }
  const d = await obterJson(`${import.meta.env.BASE_URL}dados/acesso_rural_estradas.json`)
  return { ...base, valor: d.valor, ano: d.ano, fonte: 'Banco Mundial — Measuring Rural Access (estimativa)', link: d.metadados.link, nota: d.metadados.nota }
}

async function carregar(forcar = false) {
  if (!forcar) {
    try {
      const c = JSON.parse(localStorage.getItem(CHAVE_CACHE) || 'null')
      if (c && Date.now() - c.em < VALIDADE && Object.keys(c.dados || {}).length) {
        dados.value = c.dados
        atualizadoEm.value = c.em
        return
      }
    } catch { /* cache inválida */ }
    if (Object.keys(dados.value).length) return
  }
  if (promessa) return promessa
  aCarregar.value = true
  erro.value = null
  promessa = (async () => {
    const chaves = Object.keys(INDICADORES_WB)
    const resultados = await Promise.allSettled([...chaves.map(indicadorWB), acessoEstradas()])
    const novo = {}
    resultados.forEach((r, i) => {
      const chave = i < chaves.length ? chaves[i] : 'estradas'
      if (r.status === 'fulfilled' && r.value) novo[chave] = r.value
    })
    if (!Object.keys(novo).length) {
      erro.value = 'Não foi possível obter os indicadores de Moçambique. Verifique a ligação à Internet e tente novamente.'
    } else {
      dados.value = novo
      atualizadoEm.value = Date.now()
      try { localStorage.setItem(CHAVE_CACHE, JSON.stringify({ em: atualizadoEm.value, dados: novo })) } catch { /* ignorar */ }
    }
  })().finally(() => {
    aCarregar.value = false
    promessa = null
  })
  return promessa
}

export function useMozambiqueIndicators() {
  const vazio = computed(() => !aCarregar.value && !erro.value && !Object.keys(dados.value).length)
  return { dados, aCarregar, erro, vazio, atualizadoEm, carregar }
}
