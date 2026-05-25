import { getSecretName } from '@/products/integracoes/cloud/src/config/gcpConfig'

export async function readSecret(_secretRef: string): Promise<string | null> {
  return null
}

export async function writeSecret(_name: string, _value: string): Promise<{ secretRef: string; mode: 'stub' }> {
  return {
    secretRef: getSecretName([_name]),
    mode: 'stub',
  }
}
