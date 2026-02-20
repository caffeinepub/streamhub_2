import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBulkRemoveVideos, useBulkHideVideos, useBulkFeatureVideos } from '../hooks/useQueries';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface BulkActionDialogProps {
  action: 'remove' | 'hide' | 'feature';
  videoIds: string[];
  open: boolean;
  onClose: () => void;
}

export default function BulkActionDialog({ action, videoIds, open, onClose }: BulkActionDialogProps) {
  const bulkRemove = useBulkRemoveVideos();
  const bulkHide = useBulkHideVideos();
  const bulkFeature = useBulkFeatureVideos();

  const handleConfirm = async () => {
    try {
      if (action === 'remove') {
        await bulkRemove.mutateAsync(videoIds);
        toast.success(`${videoIds.length} video(s) removed successfully`);
      } else if (action === 'hide') {
        await bulkHide.mutateAsync(videoIds);
        toast.success(`${videoIds.length} video(s) hidden successfully`);
      } else if (action === 'feature') {
        await bulkFeature.mutateAsync(videoIds);
        toast.success(`${videoIds.length} video(s) featured successfully`);
      }
      onClose();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error(error.message || 'Failed to perform bulk action');
    }
  };

  const isPending = bulkRemove.isPending || bulkHide.isPending || bulkFeature.isPending;

  const getDialogContent = () => {
    switch (action) {
      case 'remove':
        return {
          title: 'Remove Videos',
          description: `Are you sure you want to remove ${videoIds.length} video(s)?`,
          warning: 'This action cannot be undone. All video data, comments, and likes will be permanently deleted.',
          buttonText: 'Remove Videos',
          buttonVariant: 'destructive' as const,
        };
      case 'hide':
        return {
          title: 'Hide Videos',
          description: `Hide ${videoIds.length} video(s) from public view?`,
          warning: 'Hidden videos will not appear in search results or trending pages but can be restored later.',
          buttonText: 'Hide Videos',
          buttonVariant: 'default' as const,
        };
      case 'feature':
        return {
          title: 'Feature Videos',
          description: `Feature ${videoIds.length} video(s) on the platform?`,
          warning: 'Featured videos will be highlighted and promoted across the platform.',
          buttonText: 'Feature Videos',
          buttonVariant: 'default' as const,
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">{content.warning}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={content.buttonVariant} onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Processing...' : content.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
