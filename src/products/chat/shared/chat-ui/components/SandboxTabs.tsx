"use client";

import type { ElementType } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@nanostores/react';
import { $sandboxActiveTab, sandboxActions, type SandboxTab } from '@/chat/sandbox';

export default function SandboxTabs() {
  const active = useStore($sandboxActiveTab);

  const tabs: { key: SandboxTab; title: string; icon: ElementType }[] = [
    { key: 'preview', title: 'Preview', icon: Monitor },
    { key: 'code', title: 'Code', icon: Code2 },
  ];

  return (
    <Tabs value={active} onValueChange={(v) => sandboxActions.setActiveTab(v as SandboxTab)}>
      <TabsList className="!h-8 !bg-gray-100 !border !border-gray-300 !rounded-md !p-0.5 !gap-0.5">
        {tabs.map(({ key, title, icon: Icon }) => (
          <TabsTrigger
            key={key}
            value={key}
            title={title}
            aria-label={title}
            className={cn('!h-6 !w-7 !px-0 !rounded-[6px]')}
            activeClassName="!bg-white !text-gray-900 !shadow-none"
            inactiveClassName="!bg-transparent !text-gray-600 hover:!text-gray-800 hover:!bg-gray-200/70"
          >
            <Icon className="w-3.5 h-3.5" />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
