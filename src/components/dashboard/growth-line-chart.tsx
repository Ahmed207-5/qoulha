'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card } from '@/components/ui/form-elements';

export function GrowthLineChart({ data }: { data: { date: string; messages: number; visits: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-sm font-bold text-brand-950 dark:text-white">النمو خلال ٣٠ يوم</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval={4} />
          <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="messages" name="رسائل" stroke="#6b4bab" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="visits" name="زيارات" stroke="#E8A87C" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
