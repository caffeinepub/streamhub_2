import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CheckCircle } from 'lucide-react';
import { useGetAllReports, useRemoveReportedVideo } from '../hooks/useQueries';
import { toast } from 'sonner';

type SortOption = 'date' | 'count';

export default function ModerationQueue() {
  const { data: reports = [], isLoading } = useGetAllReports();
  const removeVideo = useRemoveReportedVideo();
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Extract unique reasons
  const allReasons = Array.from(
    new Set(reports.flatMap(([_, videoReports]) => videoReports.map((r) => r.reason)))
  );

  // Filter and sort reports
  const filteredReports = reports
    .map(([videoId, videoReports]) => {
      const filtered =
        reasonFilter === 'all'
          ? videoReports
          : videoReports.filter((r) => r.reason === reasonFilter);
      return [videoId, filtered] as [string, typeof videoReports];
    })
    .filter(([_, videoReports]) => videoReports.length > 0);

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'count') {
      return b[1].length - a[1].length;
    } else {
      const latestA = Math.max(...a[1].map((r) => Number(r.timestamp)));
      const latestB = Math.max(...b[1].map((r) => Number(r.timestamp)));
      return latestB - latestA;
    }
  });

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await removeVideo.mutateAsync(videoId);
      toast.success('Video removed successfully');
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error(error.message || 'Failed to remove video');
    }
  };

  // Store filter preferences in sessionStorage
  const updateFilter = (value: string) => {
    setReasonFilter(value);
    sessionStorage.setItem('moderationReasonFilter', value);
  };

  const updateSort = (value: SortOption) => {
    setSortBy(value);
    sessionStorage.setItem('moderationSort', value);
  };

  // Load preferences on mount
  useState(() => {
    const savedReason = sessionStorage.getItem('moderationReasonFilter');
    const savedSort = sessionStorage.getItem('moderationSort');
    if (savedReason) setReasonFilter(savedReason);
    if (savedSort) setSortBy(savedSort as SortOption);
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  const unresolvedCount = reports.reduce((sum, [_, videoReports]) => sum + videoReports.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderation Queue</h2>
          <p className="text-sm text-muted-foreground">
            {unresolvedCount} unresolved report{unresolvedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={reasonFilter} onValueChange={updateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {allReasons.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => updateSort(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="count">Most Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedReports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {reasonFilter === 'all' ? 'No reports to review' : 'No reports matching filter'}
          </CardContent>
        </Card>
      ) : (
        sortedReports.map(([videoId, videoReports]) => (
          <Card key={videoId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-mono text-sm">Video: {videoId}</span>
                <Badge variant="destructive">{videoReports.length} reports</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {videoReports.map((report, idx) => (
                <div key={idx} className="border-l-2 border-muted pl-4">
                  <p className="text-sm font-medium">Reason: {report.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Reporter: {report.reporter.toString().slice(0, 12)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(report.timestamp) / 1000000).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveVideo(videoId)}
                  disabled={removeVideo.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Video
                </Button>
                <Button variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Dismiss Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
