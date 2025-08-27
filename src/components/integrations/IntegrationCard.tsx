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
import MercadoLivreIcon from "@/components/icons/MercadoLivreIcon"
import ShopeeIcon from "@/components/icons/ShopeeIcon"
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
  'mercado-livre': MercadoLivreIcon,
  shopee: ShopeeIcon,
  'conta-azul': Globe, // fallback
}

export function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const IconComponent = iconMap[integration.icon as keyof typeof iconMap] || Globe;

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl">
                <IconComponent className="w-12 h-12 rounded-xl" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {integration.description}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-6">
            <Button 
              variant={integration.connected ? "outline" : "default"}
              className={`px-6 py-2 font-medium ${
                integration.connected 
                  ? "text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-300" 
                  : "bg-black text-white hover:bg-gray-800"
              }`}
              onClick={() => onToggle(integration.id, !integration.connected)}
            >
              {integration.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>
        
        {/* Configurações específicas para integração conectada */}
        {integration.connected && integration.id === 'slack' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Messages</h4>
                  <p className="text-sm text-gray-600">Send incoming messages to my channel</p>
                </div>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Missed calls</h4>
                  <p className="text-sm text-gray-600">Send missed calls to my channel</p>
                </div>
                <Switch checked={true} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}