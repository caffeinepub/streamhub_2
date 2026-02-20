import { useParams } from '@tanstack/react-router';
import { useGetUserProfile, useGetTrendingVideos } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscribeButton from '../components/SubscribeButton';
import VideoCard from '../components/VideoCard';
import { Edit } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams({ from: '/profile/$userId' });
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetUserProfile(userId);
  const { data: allVideos = [] } = useGetTrendingVideos();

  const isOwnProfile = identity ? userId === identity.getPrincipal().toString() : false;
  const userVideos = allVideos.filter((v) => v.uploader.toString() === userId);

  if (isLoading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <p className="text-muted-foreground">This user doesn't have a profile yet.</p>
      </div>
    );
  }

  const profilePictureUrl = profile.profilePicture
    ? profile.profilePicture.getDirectURL()
    : '/assets/generated/default-avatar.dim_200x200.png';

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profilePictureUrl} alt={profile.username} />
              <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{profile.username}</h1>
                  {profile.email && (
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  )}
                </div>
                {isOwnProfile ? (
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <SubscribeButton channelId={userId} isOwnChannel={false} />
                )}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{userVideos.length}</span>
                  <span className="text-muted-foreground ml-1">videos</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>
                  <span className="text-muted-foreground ml-1">subscribers</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          {userVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No videos uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            No playlists created yet
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
