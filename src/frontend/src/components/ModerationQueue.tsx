import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle } from 'lucide-react';
import { useGetAllReports, useRemoveReportedVideo } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function ModerationQueue() {
  const { data: reports = [], isLoading } = useGetAllReports();
  const removeVideo = useRemoveReportedVideo();

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await removeVideo.mutateAsync(videoId);
      toast.success('Video removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove video');
    }
  };

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Moderation Queue</h2>
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No reports to review
          </CardContent>
        </Card>
      ) : (
        reports.map(([videoId, videoReports]) => (
          <Card key={videoId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Video ID: {videoId}</span>
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
