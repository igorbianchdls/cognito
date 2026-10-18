import { hostConfig } from '../shared/config'

export type { PluginConfig } from '../../shared/config'
// ChatGPT also keeps the key that signs native form continuations (MCP 2026-07-28 / MRTR).
export const getPluginConfig = () => hostConfig({ host: 'chatgpt', prefix: 'CHATGPTPLUGIN', path: '/api/mcp', origin: 'https://chatgpt.com', extra: { nativeFormKey: process.env.CHATGPTPLUGIN_FORM_STATE_KEY } })
