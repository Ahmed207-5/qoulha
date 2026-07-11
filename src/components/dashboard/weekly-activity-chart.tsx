'use client';

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/form-elements';

export function WeeklyActivityChart({ data }: { data: { day: string; count: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-sm font-bold text-brand-950 dark:text-white">النشاط الأسبوعي</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="count" name="رسائل" fill="#6b4bab" radius={[8, 8, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
