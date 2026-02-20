import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const { identity } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please login to view your watch history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Watch History</h1>
          <p className="text-muted-foreground">Videos you've watched</p>
        </div>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        Watch history feature coming soon
      </div>
    </div>
  );
}
