import { useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function PlaylistPage() {
  const { playlistId } = useParams({ from: '/playlist/$playlistId' });
  const { identity } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please login to view playlists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Playlist</h1>
        <p className="text-muted-foreground">Playlist ID: {playlistId}</p>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        Playlist feature coming soon
      </div>
    </div>
  );
}
