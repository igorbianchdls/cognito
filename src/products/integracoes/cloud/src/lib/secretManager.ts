export async function readSecret(_secretRef: string): Promise<string | null> {
  return null
}

export async function writeSecret(_name: string, _value: string): Promise<{ secretRef: string; mode: 'stub' }> {
  return {
    secretRef: `stub/${_name}`,
    mode: 'stub',
  }
}
