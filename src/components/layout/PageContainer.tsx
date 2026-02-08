import React from 'react';
import { cn } from '@/lib/utils';

type PageContainerProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

// White-right container without padding. Holds page panels side by side.
export default function PageContainer({ className, style, children }: PageContainerProps) {
  return (
    <div className={cn('h-full w-full bg-white overflow-hidden', className)} style={style}>
      {children}
    </div>
  );
}

