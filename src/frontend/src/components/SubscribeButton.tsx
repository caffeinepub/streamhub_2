import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useSubscribeToChannel } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface SubscribeButtonProps {
  channelId: string;
  isOwnChannel: boolean;
}

export default function SubscribeButton({ channelId, isOwnChannel }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const subscribe = useSubscribeToChannel();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      return;
    }

    try {
      await subscribe.mutateAsync(channelId);
      toast.success('Subscribed successfully!');
    } catch (error: any) {
      console.error('Subscribe error:', error);
      if (error.message?.includes('Already subscribed')) {
        toast.info('Already subscribed to this channel');
      } else {
        toast.error('Failed to subscribe');
      }
    }
  };

  if (isOwnChannel) {
    return null;
  }

  return (
    <Button onClick={handleSubscribe} disabled={subscribe.isPending}>
      <UserPlus className="mr-2 h-4 w-4" />
      {subscribe.isPending ? 'Subscribing...' : 'Subscribe'}
    </Button>
  );
}
