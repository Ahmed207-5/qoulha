'use server';

import { createClient } from '@/lib/supabase/server';

export interface LinkAnalyticsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

export interface ProfileLinkAnalytics {
  visits: LinkAnalyticsSummary;
  uniqueVisitors: LinkAnalyticsSummary;
  qrScans: LinkAnalyticsSummary;
  shareOpens: LinkAnalyticsSummary;
  messagesReceivedAllTime: number;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export async function getProfileLinkAnalytics(profileId: string): Promise<ProfileLinkAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const todayIso = startOfDay(now).toISOString();
  const weekIso = startOfWeek(now).toISOString();
  const monthIso = startOfMonth(now).toISOString();

  const { data: visitRows } = await supabase
    .from('visits')
    .select('visitor_fingerprint, source, created_at')
    .eq('profile_id', profileId);

  const rows = visitRows ?? [];

  function summarize(predicate: (r: (typeof rows)[number]) => boolean): LinkAnalyticsSummary {
    const matching = rows.filter(predicate);
    return {
      today: matching.filter((r) => r.created_at >= todayIso).length,
      thisWeek: matching.filter((r) => r.created_at >= weekIso).length,
      thisMonth: matching.filter((r) => r.created_at >= monthIso).length,
      allTime: matching.length,
    };
  }

  function summarizeUnique(predicate: (r: (typeof rows)[number]) => boolean): LinkAnalyticsSummary {
    const inWindow = (since: string) =>
      new Set(rows.filter((r) => predicate(r) && r.created_at >= since).map((r) => r.visitor_fingerprint)).size;
    return {
      today: inWindow(todayIso),
      thisWeek: inWindow(weekIso),
      thisMonth: inWindow(monthIso),
      allTime: new Set(rows.filter(predicate).map((r) => r.visitor_fingerprint)).size,
    };
  }

  const { count: messagesReceivedAllTime } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', profileId)
    .eq('is_deleted', false);

  return {
    visits: summarize(() => true),
    uniqueVisitors: summarizeUnique(() => true),
    qrScans: summarize((r) => r.source === 'qr'),
    shareOpens: summarize((r) => ['share', 'whatsapp', 'telegram', 'facebook', 'x'].includes(r.source)),
    messagesReceivedAllTime: messagesReceivedAllTime ?? 0,
  };
}
