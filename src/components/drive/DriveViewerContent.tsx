import ImageViewer from './viewers/ImageViewer'
import PdfViewer from './viewers/PdfViewer'
import VideoViewer from './viewers/VideoViewer'
import AudioViewer from './viewers/AudioViewer'
import TextViewer from './viewers/TextViewer'
import UnsupportedViewer from './viewers/UnsupportedViewer'
import { isPdf, isImage, isVideo, isAudio, isText } from './utils/fileTypes'

export default function DriveViewerContent({ mime, url, name }: { mime?: string; url?: string; name?: string }) {
  if (isImage(mime)) return <ImageViewer src={url} alt={name} />
  if (isPdf(mime)) return <PdfViewer url={url} />
  if (isVideo(mime)) return <VideoViewer src={url} />
  if (isAudio(mime)) return <AudioViewer src={url} />
  if (isText(mime)) return <TextViewer content={`Preview de ${name || 'arquivo'}`} />
  return <UnsupportedViewer />
}

