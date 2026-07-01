'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type Props = {
  completed: number;
  total: number;
  className?: string;
};

export const CompletionRingChart = ({ completed, total, className }: Props) => {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = 100 - rate;

  const data = [
    { name: 'Completed', value: rate },
    { name: 'Remaining', value: remaining },
  ];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#1A5CF8" />
              <Cell fill="#E2E8F0" />
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [`${v}%`, name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{rate}%</span>
          <span className="text-xs text-slate-500">Done</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {completed} of {total} tasks completed
      </p>
    </div>
  );
};
