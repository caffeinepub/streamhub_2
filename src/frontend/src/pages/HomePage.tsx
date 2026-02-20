import { useGetTrendingVideos } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: videos = [], isLoading } = useGetTrendingVideos();

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative h-64 rounded-xl overflow-hidden">
        <img
          src="/assets/generated/hero-banner.dim_1920x600.png"
          alt="StreamHub Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent flex items-end">
          <div className="p-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Welcome to StreamHub
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover amazing videos from creators around the world
            </p>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No videos available yet. Be the first to upload!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
