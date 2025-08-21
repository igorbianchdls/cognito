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
import { 
  Globe, 
  Github, 
  Music, 
  Figma,
  Slack
} from "lucide-react"
import type { Integration } from "@/data/integrations"

interface IntegrationCardProps {
  integration: Integration;
  onToggle: (id: string, connected: boolean) => void;
}

const iconMap = {
  globe: Globe,
  github: Github,
  music: Music,
  figma: Figma,
  slack: Slack,
}

export function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const IconComponent = iconMap[integration.icon as keyof typeof iconMap] || Globe;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start space-y-0 space-x-4 pb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <IconComponent className="w-6 h-6" />
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
          Details
        </Button>
      </CardContent>
    </Card>
  )
}