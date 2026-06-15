import type {
  SettingsMember,
  SettingsProfile,
  SettingsState,
  SettingsWorkspace,
  UpdateMemberInput,
  UpdateProfileInput,
  UpdateWorkspaceInput,
} from '@/products/auth/shared/settingsContracts'

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Nao foi possivel salvar as alteracoes.')
  }
  return payload as T
}

export async function fetchSettingsState(): Promise<SettingsState> {
  return requestJson<SettingsState>('/api/settings', {
    method: 'GET',
  })
}

export async function updateSettingsProfile(input: UpdateProfileInput): Promise<SettingsProfile> {
  return requestJson<SettingsProfile>('/api/settings/profile', {
    body: JSON.stringify(input),
    method: 'PATCH',
  })
}

export async function updateSettingsWorkspace(input: UpdateWorkspaceInput): Promise<SettingsWorkspace> {
  return requestJson<SettingsWorkspace>('/api/settings/workspace', {
    body: JSON.stringify(input),
    method: 'PATCH',
  })
}

export async function updateSettingsMember(input: UpdateMemberInput): Promise<SettingsMember> {
  return requestJson<SettingsMember>('/api/settings/members', {
    body: JSON.stringify(input),
    method: 'PATCH',
  })
}
