import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

export const AvatarWithFallback = ({ name, src, size = 32, className }: Props) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
};
