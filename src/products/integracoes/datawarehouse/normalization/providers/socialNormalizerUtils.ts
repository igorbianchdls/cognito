import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

const RESOURCE_TABLES: Record<string, NormalizedTableName> = {
  profiles: 'social_profiles',
  posts: 'social_posts',
  videos: 'social_videos',
  comments: 'social_comments',
  audience_daily: 'social_audience_daily',
  performance_daily: 'social_performance_daily',
  engagement_daily: 'social_engagement_daily',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function unwrapPayload(row: JsonRecord): JsonRecord {
  const payload = row.raw_payload ?? row.rawPayload ?? row.payload ?? row.source_payload ?? row.raw
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as unknown
      return isRecord(parsed) ? unwrapPayload(parsed) : {}
    } catch {
      return {}
    }
  }
  if (!isRecord(payload)) return row
  return isRecord(payload.raw) ? payload.raw : payload
}

function nestedValue(row: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) return undefined
    return current[part]
  }, row)
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
  }
  return null
}

function numberValue(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    const parsed = typeof value === 'string'
      ? Number(value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, ''))
      : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function dateValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toISOString().slice(0, 10)
}

function timestampValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const numeric = Number(value)
  const date = Number.isFinite(numeric) && numeric > 1000000000
    ? new Date(numeric * (numeric < 100000000000 ? 1000 : 1))
    : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function externalId(row: JsonRecord, payload: JsonRecord, index: number) {
  return text(row, ['external_id', 'id'])
    || text(payload, ['id', 'ID', 'urn', 'video_id', 'comment_id', 'date', 'day'])
    || `social_${index + 1}`
}

function base(input: NormalizationInput, table: NormalizedTableName, row: JsonRecord, payload: JsonRecord, index: number) {
  return {
    tenant_id: input.tenantId,
    connection_id: input.connectionId,
    provider: input.provider,
    resource: input.resource,
    external_id: externalId(row, payload, index),
    source_run_id: input.runId || null,
    source_table: input.sourceTable,
    synced_at: new Date().toISOString(),
    normalized_at: new Date().toISOString(),
  }
}

function profileFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['name', 'display_name', 'localizedName', 'snippet.title', 'instagram_business_account.name']),
    username: text(payload, ['username', 'vanityName', 'instagram_business_account.username']),
    url: text(payload, ['profile_deep_link', 'permalink', 'url', 'snippet.customUrl']),
    avatar_url: text(payload, ['avatar_url', 'profile_picture_url', 'instagram_business_account.profile_picture_url', 'snippet.thumbnails.default.url']),
    followers: numberValue(payload, ['followers_count', 'follower_count', 'statistics.subscriberCount', 'instagram_business_account.followers_count']),
    following: numberValue(payload, ['follows_count', 'following_count']),
    posts_count: numberValue(payload, ['media_count', 'video_count', 'statistics.videoCount', 'instagram_business_account.media_count']),
    status: text(payload, ['status', 'state', 'is_verified']),
  }
}

function contentFields(payload: JsonRecord) {
  return {
    profile_id: text(payload, ['profile_id', 'channelId', 'snippet.channelId', 'author', 'organization', 'owner.id']),
    titulo: text(payload, ['title', 'snippet.title', 'localized.title']),
    texto: text(payload, ['caption', 'text', 'description', 'video_description', 'snippet.description', 'commentary.text.text']),
    url: text(payload, ['permalink', 'share_url', 'embed_link', 'media_url', 'url']),
    tipo: text(payload, ['media_type', 'type', 'kind']),
    published_at: timestampValue(payload, ['published_at', 'timestamp', 'create_time', 'snippet.publishedAt', 'created.time']),
    views: numberValue(payload, ['view_count', 'views', 'statistics.viewCount']),
    likes: numberValue(payload, ['like_count', 'likes', 'statistics.likeCount']),
    comments: numberValue(payload, ['comments_count', 'comment_count', 'comments', 'statistics.commentCount']),
    shares: numberValue(payload, ['share_count', 'shares']),
    saves: numberValue(payload, ['save_count', 'saves']),
    status: text(payload, ['status', 'lifecycleState', 'visibility']),
  }
}

function commentFields(payload: JsonRecord) {
  return {
    post_id: text(payload, ['post_id', 'media_id', 'videoId', 'snippet.videoId', 'object']),
    profile_id: text(payload, ['profile_id', 'channelId', 'snippet.channelId']),
    author_id: text(payload, ['author_id', 'from.id', 'snippet.topLevelComment.snippet.authorChannelId.value']),
    author_name: text(payload, ['author_name', 'username', 'from.name', 'snippet.topLevelComment.snippet.authorDisplayName']),
    texto: text(payload, ['text', 'message', 'snippet.topLevelComment.snippet.textDisplay', 'snippet.textDisplay']),
    created_at: timestampValue(payload, ['created_at', 'timestamp', 'created.time', 'snippet.topLevelComment.snippet.publishedAt', 'snippet.publishedAt']),
    likes: numberValue(payload, ['like_count', 'likes', 'snippet.topLevelComment.snippet.likeCount']),
    status: text(payload, ['status', 'moderationStatus']),
  }
}

function dailyMetricFields(payload: JsonRecord) {
  const values = Array.isArray(payload.value) ? payload.value : undefined
  return {
    profile_id: text(payload, ['profile_id', 'channelId', 'organization', 'id']),
    data_ref: dateValue(payload, ['date', 'day', 'end_time', 'timeRange.start']) || (values?.[0] ? dateValue({ value: values[0] }, ['value']) : null),
    metric: text(payload, ['name', 'metric', 'title']),
    value: numberValue(payload, ['value', 'values.0.value', '1']),
    views: numberValue(payload, ['views', 'view_count']) ?? (values ? numberValue({ value: values[1] }, ['value']) : null),
    impressions: numberValue(payload, ['impressions', 'totalShareStatistics.impressionCount']),
    reach: numberValue(payload, ['reach']),
    likes: numberValue(payload, ['likes', 'like_count', 'totalShareStatistics.likeCount']),
    comments: numberValue(payload, ['comments', 'comment_count', 'totalShareStatistics.commentCount']),
    shares: numberValue(payload, ['shares', 'share_count', 'totalShareStatistics.shareCount']),
    followers: numberValue(payload, ['followers', 'follower_count', 'subscribersGained']),
    engagement_rate: numberValue(payload, ['engagement_rate', 'impressionClickThroughRate']),
  }
}

function fieldsFor(table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'social_profiles') return profileFields(payload)
  if (table === 'social_posts' || table === 'social_videos') return contentFields(payload)
  if (table === 'social_comments') return commentFields(payload)
  return dailyMetricFields(payload)
}

export function normalizeSocialRows(input: NormalizationInput): NormalizationResult {
  const table = RESOURCE_TABLES[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso social ${input.resource} nao possui tabela normalized v1.`,
    }
  }

  const rows: NormalizedRow[] = input.rows.map((row, index) => {
    const payload = unwrapPayload(row)
    return {
      table,
      insertId: `${input.connectionId}:${input.provider}:${input.resource}:${externalId(row, payload, index)}`,
      data: {
        ...base(input, table, row, payload, index),
        ...fieldsFor(table, payload),
      },
    }
  })

  return {
    provider: input.provider,
    resource: input.resource,
    status: 'normalized',
    tables: [table],
    rows,
    skippedRows: 0,
  }
}
