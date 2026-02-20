import { useParams } from '@tanstack/react-router';
import { useGetTrendingVideos } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import VideoPlayer from '../components/VideoPlayer';
import LikeButton from '../components/LikeButton';
import CommentSection from '../components/CommentSection';
import SubscribeButton from '../components/SubscribeButton';
import ReportVideoButton from '../components/ReportVideoButton';
import VideoCard from '../components/VideoCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoPage() {
  const { videoId } = useParams({ from: '/watch/$videoId' });
  const { data: videos = [] } = useGetTrendingVideos();
  const { identity } = useInternetIdentity();

  const video = videos.find((v) => v.id === videoId);
  const relatedVideos = videos.filter((v) => v.id !== videoId).slice(0, 8);

  const isOwner = identity && video ? video.uploader.toString() === identity.getPrincipal().toString() : false;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Video not found</h2>
        <p className="text-muted-foreground">The video you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <VideoPlayer video={video} />

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{video.views.toString()} views</span>
              <span>•</span>
              <span>{new Date(Number(video.uploadTime) / 1000000).toLocaleDateString()}</span>
              <Badge>{video.category}</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{video.uploader.toString().slice(0, 12)}...</p>
              </div>
              <SubscribeButton channelId={video.uploader.toString()} isOwnChannel={isOwner} />
            </div>
            <div className="flex items-center gap-2">
              <LikeButton videoId={video.id} initialLikes={Number(video.views)} />
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <ReportVideoButton videoId={video.id} isOwner={isOwner} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{video.description}</p>
          </div>

          <Separator />

          <CommentSection videoId={video.id} comments={[]} />
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="space-y-4">
        <h3 className="font-semibold">Related Videos</h3>
        <div className="space-y-4">
          {relatedVideos.map((relatedVideo) => (
            <VideoCard key={relatedVideo.id} video={relatedVideo} />
          ))}
        </div>
      </div>
    </div>
  );
}
