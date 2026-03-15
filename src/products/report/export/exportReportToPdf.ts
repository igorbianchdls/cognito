'use client'

import type { CapturedReportPageImage } from '@/products/report/export/types'

const PDF_PAGE_WIDTH = 595.28
const PDF_PAGE_HEIGHT = 841.89

function sanitizeFileName(name: string) {
  const base = name.trim() || 'relatorio'
  return base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, '-').toLowerCase()
}

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',')
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function getJpegDimensions(bytes: Uint8Array) {
  let offset = 2

  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break

    const marker = bytes[offset]
    offset += 1

    if (marker === 0xd8 || marker === 0xd9) continue
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue

    const blockLength = (bytes[offset] << 8) | bytes[offset + 1]
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4]
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6]
      return { width, height }
    }

    offset += blockLength
  }

  throw new Error('Could not read JPEG dimensions')
}

function fitImageToPage(imageWidth: number, imageHeight: number) {
  const scale = Math.min(PDF_PAGE_WIDTH / imageWidth, PDF_PAGE_HEIGHT / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  const x = (PDF_PAGE_WIDTH - width) / 2
  const y = (PDF_PAGE_HEIGHT - height) / 2
  return { width, height, x, y }
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const merged = new Uint8Array(totalLength)
  let offset = 0

  parts.forEach((part) => {
    merged.set(part, offset)
    offset += part.length
  })

  return merged
}

function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${sanitizeFileName(fileName)}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportReportToPdf(fileName: string, pages: CapturedReportPageImage[]) {
  const encoder = new TextEncoder()
  const objects: Uint8Array[] = []
  const offsets: number[] = [0]

  const pageObjectNumbers: number[] = []
  let objectNumber = 3

  const pageDefinitions = pages.map((page) => {
    const imageBytes = dataUrlToBytes(page.dataUrl)
    const { width: imageWidth, height: imageHeight } = getJpegDimensions(imageBytes)
    const imageObjectNumber = objectNumber
    const contentObjectNumber = objectNumber + 1
    const pageObjectNumber = objectNumber + 2
    objectNumber += 3

    pageObjectNumbers.push(pageObjectNumber)

    return {
      contentObjectNumber,
      imageBytes,
      imageHeight,
      imageObjectNumber,
      imageWidth,
      pageObjectNumber,
      pageId: page.pageId,
    }
  })

  const pagesObject = encoder.encode(
    `2 0 obj\n<< /Type /Pages /Count ${pageDefinitions.length} /Kids [${pageObjectNumbers.map((ref) => `${ref} 0 R`).join(' ')}] >>\nendobj\n`,
  )
  objects.push(encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'))
  objects.push(pagesObject)

  pageDefinitions.forEach((pageDefinition, index) => {
    const imageHeader = encoder.encode(
      `${pageDefinition.imageObjectNumber} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageDefinition.imageWidth} /Height ${pageDefinition.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pageDefinition.imageBytes.length} >>\nstream\n`,
    )
    const imageFooter = encoder.encode('\nendstream\nendobj\n')
    objects.push(concatUint8Arrays([imageHeader, pageDefinition.imageBytes, imageFooter]))

    const placement = fitImageToPage(pageDefinition.imageWidth, pageDefinition.imageHeight)
    const contentStream = `q\n${placement.width.toFixed(2)} 0 0 ${placement.height.toFixed(2)} ${placement.x.toFixed(2)} ${placement.y.toFixed(2)} cm\n/Im${index + 1} Do\nQ`
    const contentBytes = encoder.encode(contentStream)
    const contentObject = encoder.encode(
      `${pageDefinition.contentObjectNumber} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    )
    objects.push(contentObject)

    const pageObject = encoder.encode(
      `${pageDefinition.pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /XObject << /Im${index + 1} ${pageDefinition.imageObjectNumber} 0 R >> >> /Contents ${pageDefinition.contentObjectNumber} 0 R >>\nendobj\n`,
    )
    objects.push(pageObject)
  })

  let currentOffset = encoder.encode('%PDF-1.4\n').length
  objects.forEach((objectBytes) => {
    offsets.push(currentOffset)
    currentOffset += objectBytes.length
  })

  const xrefStart = currentOffset
  const xrefEntries = offsets
    .map((offset, index) => `${String(offset).padStart(10, '0')} 00000 ${index === 0 ? 'f' : 'n'} `)
    .join('\n')
  const trailer = encoder.encode(
    `xref\n0 ${offsets.length}\n${xrefEntries}\ntrailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  )

  const pdfBytes = concatUint8Arrays([encoder.encode('%PDF-1.4\n'), ...objects, trailer])
  downloadPdf(pdfBytes, fileName)
}
