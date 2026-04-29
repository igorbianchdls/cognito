'use client'

export async function persistDashboardThumbnail({
  artifactId,
  thumbnailDataUrl,
}: {
  artifactId: string
  thumbnailDataUrl: string | null
}) {
  const response = await fetch(`/api/artifacts/dashboards/${artifactId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'update-thumbnail',
      thumbnail_data_url: thumbnailDataUrl,
    }),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok || json?.ok === false) {
    throw new Error(String(json?.error || `Falha ao persistir thumbnail (${response.status})`))
  }

  return {
    artifactId: String(json?.artifact_id || artifactId),
    thumbnailDataUrl: (json?.thumbnail_data_url as string | null | undefined) ?? thumbnailDataUrl,
  }
}
