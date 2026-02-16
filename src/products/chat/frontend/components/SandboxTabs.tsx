"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Code2, Monitor, LayoutDashboard, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@nanostores/react';
import { $sandboxActiveTab, sandboxActions, type SandboxTab } from '@/products/chat/state/sandboxStore';

export default function SandboxTabs() {
  const active = useStore($sandboxActiveTab);

  const tabs: { key: SandboxTab; label: string; icon: React.ElementType }[] = [
    { key: 'preview', label: 'Preview', icon: Monitor },
    { key: 'code', label: 'Code', icon: Code2 },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <Tabs value={active} onValueChange={(v) => sandboxActions.setActiveTab(v as SandboxTab)}>
      <TabsList className="!bg-transparent !p-0 gap-2 h-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <div key={key} className="relative">
            <TabsTrigger
              value={key}
              className={cn('h-8 px-2 rounded-xl font-medium transition-colors')}
              activeClassName="!bg-gray-50 !text-gray-800 !shadow-none rounded-xl !px-2 !h-8"
              inactiveClassName="!text-gray-500 hover:!text-gray-700"
            >
              <Icon className="w-4 h-4 mr-1.5" />
              <span className="text-xs">{label}</span>
              {key === 'dashboard' && <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />}
              {active === key && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="ml-2 text-gray-500 hover:text-gray-700">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8}>
                    <DropdownMenuItem disabled>Options</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TabsTrigger>
          </div>
        ))}
      </TabsList>
    </Tabs>
  );
}
