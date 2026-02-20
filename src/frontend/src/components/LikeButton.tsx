import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { useLikeVideo } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface LikeButtonProps {
  videoId: string;
  initialLikes: number;
}

export default function LikeButton({ videoId, initialLikes }: LikeButtonProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const likeVideo = useLikeVideo();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like videos');
      return;
    }

    if (hasLiked) {
      toast.info('You already liked this video');
      return;
    }

    try {
      const newLikes = await likeVideo.mutateAsync(videoId);
      setLikes(Number(newLikes));
      setHasLiked(true);
      toast.success('Video liked!');
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like video');
    }
  };

  return (
    <Button
      variant={hasLiked ? 'default' : 'outline'}
      onClick={handleLike}
      disabled={likeVideo.isPending || hasLiked}
      className="gap-2"
    >
      <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
      <span>{likes}</span>
    </Button>
  );
}
