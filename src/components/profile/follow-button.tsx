'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toggleFollowAction } from '@/actions/follows';
import { toast } from 'sonner';
import { UserPlus, UserCheck } from 'lucide-react';

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  isAuthenticated,
  isOwnProfile,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  isAuthenticated: boolean;
  isOwnProfile: boolean;
}) {
  const [following, setFollowing] = React.useState(initialIsFollowing);
  const [pending, setPending] = React.useState(false);

  if (isOwnProfile) return null;

  async function handleClick() {
    if (!isAuthenticated) {
      toast.error('لازم تسجل دخولك عشان تتابع');
      return;
    }
    if (pending) return;

    const next = !following;
    setFollowing(next);
    setPending(true);
    const result = await toggleFollowAction(targetUserId, next);
    setPending(false);

    if (!result.success) {
      setFollowing(!next);
      toast.error(result.error ?? 'حدث خطأ');
    }
  }

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      onClick={handleClick}
      isLoading={pending}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? 'بتتابعه' : 'متابعة'}
    </Button>
  );
}
