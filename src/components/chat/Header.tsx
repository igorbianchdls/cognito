"use client";

import React from 'react';
import { MoreHorizontal, Lock } from 'lucide-react';

type HeaderProps = {
  title?: string;
  privacy?: 'Private' | 'Public' | string;
};

export default function Header({ title = 'App from Mockup', privacy = 'Private' }: HeaderProps) {
  return (
    <div className="ui-text flex items-center justify-between px-[var(--ui-pad-x)] py-[var(--ui-pad-y)] bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[18px] font-semibold text-gray-900 truncate">{title}</h1>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 bg-white">
          <Lock className="w-3.5 h-3.5" />
          {privacy}
        </span>
      </div>
      <button type="button" className="text-gray-700 hover:text-black">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}
