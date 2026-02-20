import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import type { Video } from '../backend';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail
    ? video.thumbnail.getDirectURL()
    : '/assets/generated/video-placeholder.dim_640x360.png';

  return (
    <Link to="/watch/$videoId" params={{ videoId: video.id }}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur">
            {video.category}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{video.views.toString()} views</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
