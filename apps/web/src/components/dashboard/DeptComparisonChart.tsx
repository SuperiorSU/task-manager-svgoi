'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DeptStat } from '@/data/dashboard.mock';

type Props = {
  data: DeptStat[];
};

const getBarColor = (rate: number) => {
  if (rate >= 80) return '#22C55E';
  if (rate >= 60) return '#1A5CF8';
  if (rate >= 40) return '#F59E0B';
  return '#EF4444';
};

export const DeptComparisonChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart
      data={data}
      margin={{ top: 4, right: 16, bottom: 0, left: -16 }}
      barCategoryGap="30%"
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
      <XAxis
        dataKey="code"
        tick={{ fontSize: 11, fill: '#94A3B8' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        domain={[0, 100]}
        tick={{ fontSize: 11, fill: '#94A3B8' }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => `${v}%`}
      />
      <Tooltip
        formatter={(v: number) => [`${v}%`, 'Completion rate']}
        labelFormatter={(label) =>
          data.find((d) => d.code === label)?.name ?? label
        }
        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
        cursor={{ fill: '#F8FAFC' }}
      />
      <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
        {data.map((entry) => (
          <Cell key={entry.code} fill={getBarColor(entry.completionRate)} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
