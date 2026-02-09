import type { ComponentType, ReactNode } from 'react'

import { Icon, addCollection } from '@iconify/react'
import { icons as simpleIcons } from '@iconify-json/simple-icons'
import {
  SiAirtable,
  SiCalendly,
  SiCaldotcom,
  SiCanva,
  SiClickhouse,
  SiClickup,
  SiCoda,
  SiDatabricks,
  SiDiscord,
  SiDropbox,
  SiElevenlabs,
  SiFacebook,
  SiFigma,
  SiGithub,
  SiGmail,
  SiGoogleads,
  SiGoogleanalytics,
  SiGooglecalendar,
  SiGoogledocs,
  SiGoogledrive,
  SiGooglesheets,
  SiGoogleslides,
  SiHubspot,
  SiInstagram,
  SiJira,
  SiLinear,
  SiMailchimp,
  SiMetabase,
  SiMeta,
  SiMixpanel,
  SiNotion,
  SiPosthog,
  SiSalesforce,
  SiSendgrid,
  SiSentry,
  SiShopify,
  SiSlack,
  SiSnowflake,
  SiStripe,
  SiSupabase,
  SiTelegram,
  SiTiktok,
  SiTrello,
  SiTypeform,
  SiVercel,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiZendesk,
  SiZoom,
} from '@icons-pack/react-simple-icons'

let iconCollectionRegistered = false

export function ensureSimpleIconsRegistered() {
  if (iconCollectionRegistered) return
  addCollection(simpleIcons as any)
  iconCollectionRegistered = true
}

export const ICON_KEY_BY_SLUG: Record<string, string> = {
  GMAIL: 'gmail',
  GOOGLEDRIVE: 'googledrive',
  GOOGLECALENDAR: 'googlecalendar',
  GOOGLEDOCS: 'googledocs',
  WHATSAPP: 'whatsapp',
  NOTION: 'notion',
  GOOGLESHEETS: 'googlesheets',
  GOOGLESLIDES: 'googleslides',
  GOOGLE_ANALYTICS: 'googleanalytics',
  GOOGLEADS: 'googleads',
  METAADS: 'meta',
  SLACK: 'slack',
  SHOPIFY: 'shopify',
  HUBSPOT: 'hubspot',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  AIRTABLE: 'airtable',
  SALESFORCE: 'salesforce',
  SALESFORCE_SERVICE_CLOUD: 'salesforce',
  MAILCHIMP: 'mailchimp',
  CALENDLY: 'calendly',
  CAL: 'caldotcom',
  CANVA: 'canva',
  CLICKUP: 'clickup',
  CLICKHOUSE: 'clickhouse',
  CODA: 'coda',
  DATABRICKS: 'databricks',
  DISCORD: 'discord',
  DOCUSIGN: 'docusign',
  DROPBOX: 'dropbox',
  DYNAMICS365: 'microsoftdynamics365',
  ELEVENLABS: 'elevenlabs',
  FIGMA: 'figma',
  GITHUB: 'github',
  GONG: 'gong',
  JIRA: 'jira',
  JOTFORM: 'jotform',
  KOMMO: 'kommo',
  LINKEDIN: 'linkedin',
  LINEAR: 'linear',
  METABASE: 'metabase',
  MICROSOFT_CLARITY: 'microsoftclarity',
  MICROSOFT_TEAMS: 'microsoftteams',
  MIXPANEL: 'mixpanel',
  MONDAY: 'mondaydotcom',
  NETSUITE: 'netsuite',
  ONE_DRIVE: 'microsoftonedrive',
  OUTLOOK: 'microsoftoutlook',
  PIPEDRIVE: 'pipedrive',
  POSTHOG: 'posthog',
  REMOVE_BG: 'removebg',
  SENDGRID: 'sendgrid',
  SENDLANE: 'sendlane',
  SENTRY: 'sentry',
  SERVICENOW: 'servicenow',
  SNOWFLAKE: 'snowflake',
  STRIPE: 'stripe',
  SUPABASE: 'supabase',
  TALLY: 'tally',
  TELEGRAM: 'telegram',
  TIKTOK: 'tiktok',
  TRELLO: 'trello',
  TWITTER: 'x',
  TYPEFORM: 'typeform',
  VERCEL: 'vercel',
  YOUTUBE: 'youtube',
  ZENDESK: 'zendesk',
  ZOOM: 'zoom',
  ACTIVE_CAMPAIGN: 'activecampaign',
}

export const SIMPLE_ICON_BY_SLUG: Record<string, ComponentType<any>> = {
  GMAIL: SiGmail,
  GOOGLEDRIVE: SiGoogledrive,
  GOOGLECALENDAR: SiGooglecalendar,
  GOOGLEDOCS: SiGoogledocs,
  WHATSAPP: SiWhatsapp,
  NOTION: SiNotion,
  GOOGLESHEETS: SiGooglesheets,
  GOOGLESLIDES: SiGoogleslides,
  GOOGLE_ANALYTICS: SiGoogleanalytics,
  GOOGLEADS: SiGoogleads,
  METAADS: SiMeta,
  SLACK: SiSlack,
  SHOPIFY: SiShopify,
  HUBSPOT: SiHubspot,
  FACEBOOK: SiFacebook,
  INSTAGRAM: SiInstagram,
  AIRTABLE: SiAirtable,
  SALESFORCE: SiSalesforce,
  MAILCHIMP: SiMailchimp,
  CALENDLY: SiCalendly,
  CAL: SiCaldotcom,
  CANVA: SiCanva,
  CLICKUP: SiClickup,
  CLICKHOUSE: SiClickhouse,
  CODA: SiCoda,
  DATABRICKS: SiDatabricks,
  DISCORD: SiDiscord,
  DROPBOX: SiDropbox,
  ELEVENLABS: SiElevenlabs,
  FIGMA: SiFigma,
  GITHUB: SiGithub,
  JIRA: SiJira,
  LINEAR: SiLinear,
  METABASE: SiMetabase,
  MIXPANEL: SiMixpanel,
  POSTHOG: SiPosthog,
  SENDGRID: SiSendgrid,
  SENTRY: SiSentry,
  SNOWFLAKE: SiSnowflake,
  STRIPE: SiStripe,
  SUPABASE: SiSupabase,
  TELEGRAM: SiTelegram,
  TIKTOK: SiTiktok,
  TRELLO: SiTrello,
  TYPEFORM: SiTypeform,
  VERCEL: SiVercel,
  TWITTER: SiX,
  YOUTUBE: SiYoutube,
  ZENDESK: SiZendesk,
  ZOOM: SiZoom,
}

function hasIconByKey(key: string | undefined): boolean {
  if (!key) return false
  const dict = (simpleIcons as any).icons || {}
  return Boolean(dict[key])
}

export function toolkitHasIcon(slug: string): boolean {
  const key = (slug || '').toUpperCase()
  if (SIMPLE_ICON_BY_SLUG[key]) return true
  return hasIconByKey(ICON_KEY_BY_SLUG[key])
}

export function renderIntegrationLogo(slug: string, name: string): ReactNode {
  ensureSimpleIconsRegistered()

  const key = (slug || '').toUpperCase()
  const SimpleComponent = SIMPLE_ICON_BY_SLUG[key]

  if (SimpleComponent) {
    return <SimpleComponent size={32} color="default" title={`${name} logo`} />
  }

  const iconKey = ICON_KEY_BY_SLUG[key]
  if (hasIconByKey(iconKey)) {
    return (
      <Icon
        icon={`simple-icons:${iconKey}`}
        width={32}
        height={32}
        aria-label={`${name} logo`}
        className="shrink-0"
      />
    )
  }

  const initials = (name || '?').trim().slice(0, 2).toUpperCase()
  return (
    <div className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 text-xs grid place-items-center shrink-0">
      {initials}
    </div>
  )
}
