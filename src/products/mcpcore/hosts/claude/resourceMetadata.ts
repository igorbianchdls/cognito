import { metadataOptions, resourceMetadataFor } from '../shared/resourceMetadata'
import { getClaudePluginConfig } from './config'

export { metadataOptions }
export const resourceMetadata = () => resourceMetadataFor(getClaudePluginConfig)
