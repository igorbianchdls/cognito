"use client"

import * as React from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import MetaIcon from "@/components/icons/MetaIcon"
import GoogleAdsIcon from "@/components/icons/GoogleAdsIcon"
import GoogleAnalyticsIcon from "@/components/icons/GoogleAnalyticsIcon"
import AmazonIcon from "@/components/icons/AmazonIcon"
import ShopifyIcon from "@/components/icons/ShopifyIcon"
import GoogleIcon from "@/components/icons/GoogleIcon"
import type { Integration } from "@/data/integrations"

interface IntegrationCardProps {
  integration: Integration;
  onToggle: (id: string, connected: boolean) => void;
}

const iconMap = {
  meta: MetaIcon,
  'google-ads': GoogleAdsIcon,
  'google-analytics': GoogleAnalyticsIcon,
  amazon: AmazonIcon,
  shopify: ShopifyIcon,
  google: GoogleIcon,
  shopee: Globe, // fallback
  'conta-azul': Globe, // fallback
}

export function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const IconComponent = iconMap[integration.icon as keyof typeof iconMap] || Globe;

  return (
    <Card 
      className="flex flex-col bg-white border border-gray-300"
      style={{
        boxShadow: `
          0 0 0 1px rgba(0, 0, 0, 0.05),
          0 2px 3px -2px rgba(0, 0, 0, 0.05),
          0 3px 12px -4px rgba(0, 0, 0, 0.15),
          0 4px 16px -8px rgba(0, 0, 0, 0.15)
        `
      }}>
      <CardHeader className="flex-row items-start space-y-0 space-x-4 pb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <IconComponent className="w-full h-full" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold">
            {integration.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {integration.description}
          </CardDescription>
        </div>
        <div className="flex-shrink-0">
          <Switch
            checked={integration.connected}
            onCheckedChange={(checked) => onToggle(integration.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button variant="outline" size="sm" className="text-sm">
          Conectar
        </Button>
      </CardContent>
    </Card>
  )
}