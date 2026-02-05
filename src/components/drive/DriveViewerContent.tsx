import ImageViewer from './viewers/ImageViewer'
import PdfViewer from './viewers/PdfViewer'
import VideoViewer from './viewers/VideoViewer'
import AudioViewer from './viewers/AudioViewer'
import TextViewer from './viewers/TextViewer'
import UnsupportedViewer from './viewers/UnsupportedViewer'
import { isPdf, isImage, isVideo, isAudio, isText } from './utils/fileTypes'

export type ViewerHandlers = {
  zoomIn?: () => void
  zoomOut?: () => void
  resetZoom?: () => void
  rotate?: () => void
  togglePlay?: () => void
  getZoomText?: () => string | undefined
}

export default function DriveViewerContent({ mime, url, name, register }: { mime?: string; url?: string; name?: string; register?: (h: ViewerHandlers) => void }) {
  if (isImage(mime)) return <ImageViewer src={url} alt={name} register={register} />
  if (isPdf(mime)) return <PdfViewer url={url} register={register} />
  if (isVideo(mime)) return <VideoViewer src={url} register={register} />
  if (isAudio(mime)) return <AudioViewer src={url} />
  if (isText(mime)) return <TextViewer content={`Preview de ${name || 'arquivo'}`} />
  return <UnsupportedViewer />
}
