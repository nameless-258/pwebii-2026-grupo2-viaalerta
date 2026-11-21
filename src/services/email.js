// Envio de email com EmailJS (requisito R3), chamado directamente do browser.
// Usa apenas a CHAVE PÚBLICA do EmailJS; o modelo da mensagem é configurado no painel do EmailJS
// e os domínios autorizados devem ser limitados ao GitHub Pages do grupo.
// Sem configuração, o envio é simulado (registado na consola) para não bloquear a aplicação.

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

export const emailConfigurado = Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID)

/**
 * Parâmetros do modelo EmailJS (usar estes nomes no painel):
 *   {{to_email}} {{to_name}} {{assunto}} {{mensagem}} {{referencia}} {{estado}} {{link}}
 * @returns {Promise<'enviado'|'simulado'|'falhou'>}
 */
export async function enviarEmail(parametros) {
  if (!parametros?.to_email) return 'falhou'
  if (!emailConfigurado) {
    console.info('[EmailJS] não configurado — email simulado:', parametros)
    return 'simulado'
  }
  try {
    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: SERVICE_ID, template_id: TEMPLATE_ID, user_id: PUBLIC_KEY, template_params: parametros })
    })
    if (!resp.ok) throw new Error(await resp.text())
    return 'enviado'
  } catch (e) {
    console.error('[EmailJS] falha no envio', e)
    return 'falhou'
  }
}
