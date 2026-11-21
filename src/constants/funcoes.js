// Funções (papéis) de acesso
export const FUNCOES = {
  cidadao: 'Cidadão',
  responsavel: 'Responsável autorizado',
  admin: 'Administrador'
}
// Cidadãos criam denúncias; responsáveis e administradores apenas as gerem.
export const isCidadao = (role) => role === 'cidadao'
export const isStaff = (role) => role === 'admin' || role === 'responsavel'
