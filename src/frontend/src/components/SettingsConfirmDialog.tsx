import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdatePlatformSettings } from '../hooks/useQueries';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import type { PlatformSettings } from '../backend';

interface SettingsConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  changes: string[];
  newSettings: PlatformSettings;
}

export default function SettingsConfirmDialog({ open, onClose, changes, newSettings }: SettingsConfirmDialogProps) {
  const updateSettings = useUpdatePlatformSettings();

  const handleConfirm = async () => {
    try {
      await updateSettings.mutateAsync(newSettings);
      toast.success('Platform settings updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Update settings error:', error);
      toast.error(error.message || 'Failed to update settings');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Settings Changes</DialogTitle>
          <DialogDescription>
            Review the changes before applying them platform-wide.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              These changes will apply platform-wide immediately and affect all users.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Changes to be applied:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateSettings.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Applying...' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
