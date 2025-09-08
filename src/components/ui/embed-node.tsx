'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react';
import { cn } from '@/lib/utils';

export function EmbedElement(props: PlateElementProps) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  const { embedUrl, width = 600, height = 400 } = element as any;

  if (!embedUrl) {
    return (
      <PlateElement {...props}>
        <div className="py-4" contentEditable={false}>
          <div className="border border-red-300 bg-red-50 p-4 rounded-lg text-center">
            <p className="text-red-600">Invalid embed URL</p>
          </div>
        </div>
        {props.children}
      </PlateElement>
    );
  }

  // Validate embed URL format
  const isValidEmbedUrl = embedUrl.includes('/embed/widget/');
  
  if (!isValidEmbedUrl) {
    return (
      <PlateElement {...props}>
        <div className="py-4" contentEditable={false}>
          <div className="border border-red-300 bg-red-50 p-4 rounded-lg text-center">
            <p className="text-red-600">Invalid widget embed URL</p>
            <p className="text-sm text-gray-500 mt-1">URL must contain /embed/widget/</p>
          </div>
        </div>
        {props.children}
      </PlateElement>
    );
  }

  return (
    <PlateElement {...props}>
      <div className="py-4" contentEditable={false}>
        <div 
          className={cn(
            'border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm',
            selected && focused && 'ring-2 ring-blue-500 ring-opacity-50',
            !readOnly && 'cursor-pointer'
          )}
          style={{ width: '100%', maxWidth: `${width}px` }}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height={height}
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin"
            className="w-full"
            title="Embedded Widget"
            loading="lazy"
          />
        </div>
      </div>
      {props.children}
    </PlateElement>
  );
}