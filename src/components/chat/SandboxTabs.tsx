"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Code2, Monitor, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'preview' | 'code' | 'console';

export default function SandboxTabs() {
  const [active, setActive] = useState<TabKey>('preview');

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'preview', label: 'Preview', icon: Monitor },
    { key: 'code', label: 'Code', icon: Code2 },
    { key: 'console', label: 'Console', icon: Terminal },
  ];

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as TabKey)}>
      <TabsList className="bg-transparent p-0 gap-3 h-9">
        {tabs.map(({ key, label, icon: Icon }) => (
          <div key={key} className="relative">
            <TabsTrigger
              value={key}
              className={cn(
                'h-9 px-3 rounded-xl text-sm font-medium',
                // Inactive: lighter title
                'text-gray-500 hover:text-gray-700',
                // Active: gray background + slightly darker title
                'data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800',
                'data-[state=active]:border data-[state=active]:border-gray-200',
                'data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent',
                'transition-colors'
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
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
