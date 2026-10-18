import { metadataOptions, resourceMetadataFor } from '../shared/resourceMetadata'
import { getPluginConfig } from './config'

export { metadataOptions }
export const resourceMetadata = () => resourceMetadataFor(getPluginConfig)
