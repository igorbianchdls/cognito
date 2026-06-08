import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

export type IntegrationProviderSetupStage =
  | 'available_manual'
  | 'oauth_ready'
  | 'oauth_coming'
  | 'catalog_only'

export type IntegrationProviderSetupStageInfo = {
  stage: IntegrationProviderSetupStage
  label: string
  description: string
  canCreateConnection: boolean
}

export function getProviderSetupStage(provider?: IntegrationProvider | null): IntegrationProviderSetupStageInfo {
  if (!provider) {
    return {
      stage: 'catalog_only',
      label: 'Catalogo',
      description: 'Item listado para planejamento; ainda nao possui contrato de conexao ativo.',
      canCreateConnection: false,
    }
  }

  if (provider.authType === 'oauth2') {
    return {
      stage: provider.supportsOAuthCallback ? 'oauth_ready' : 'oauth_coming',
      label: provider.supportsOAuthCallback ? 'OAuth preparado' : 'OAuth em breve',
      description: provider.supportsOAuthCallback
        ? 'Contrato e callback estao preparados; a conexao ficara aguardando autorizacao real do provider.'
        : 'Provider previsto para OAuth, mas ainda sem callback operacional.',
      canCreateConnection: provider.supportsOAuthCallback,
    }
  }

  return {
    stage: 'available_manual',
    label: 'Credencial manual',
    description: 'Conexao disponivel por credencial informada pelo usuario.',
    canCreateConnection: true,
  }
}
