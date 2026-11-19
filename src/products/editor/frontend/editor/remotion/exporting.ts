import { createContext, useContext } from 'react'

/**
 * True while the project is being exported (rendered in the browser to MP4). Video and audio then use the
 * @remotion/media components, which decode into a canvas the renderer can draw; the preview keeps the
 * lighter HTML5 players.
 */
export const ExportingContext = createContext(false)
export const useExporting = () => useContext(ExportingContext)
