import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSuspendUser, useBanUser, useRestoreUser } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';
import { AlertTriangle } from 'lucide-react';

interface UserActionDialogProps {
  user: Principal;
  username: string;
  actionType: 'suspend' | 'ban' | 'restore';
  open: boolean;
  onClose: () => void;
}

export default function UserActionDialog({ user, username, actionType, open, onClose }: UserActionDialogProps) {
  const [reason, setReason] = useState('');
  const suspendUser = useSuspendUser();
  const banUser = useBanUser();
  const restoreUser = useRestoreUser();

  const handleSubmit = async () => {
    if ((actionType === 'suspend' || actionType === 'ban') && !reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      if (actionType === 'suspend') {
        await suspendUser.mutateAsync({ user, reason });
        toast.success(`User ${username} has been suspended`);
      } else if (actionType === 'ban') {
        await banUser.mutateAsync({ user, reason });
        toast.success(`User ${username} has been banned`);
      } else if (actionType === 'restore') {
        await restoreUser.mutateAsync(user);
        toast.success(`User ${username} has been restored`);
      }
      onClose();
      setReason('');
    } catch (error: any) {
      console.error('Action error:', error);
      toast.error(error.message || 'Failed to perform action');
    }
  };

  const isPending = suspendUser.isPending || banUser.isPending || restoreUser.isPending;

  const getDialogContent = () => {
    switch (actionType) {
      case 'suspend':
        return {
          title: 'Suspend User',
          description: `Suspend ${username}'s account. They will not be able to upload videos or interact with content.`,
          warning: 'This action is reversible. You can restore the account later.',
          buttonText: 'Suspend User',
          buttonVariant: 'default' as const,
        };
      case 'ban':
        return {
          title: 'Ban User',
          description: `Permanently ban ${username}'s account. This is a severe action.`,
          warning: 'This action is reversible but should be used carefully.',
          buttonText: 'Ban User',
          buttonVariant: 'destructive' as const,
        };
      case 'restore':
        return {
          title: 'Restore User',
          description: `Restore ${username}'s account to active status.`,
          warning: 'The user will regain full access to the platform.',
          buttonText: 'Restore User',
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

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">{content.warning}</p>
          </div>

          {(actionType === 'suspend' || actionType === 'ban') && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={content.buttonVariant} onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Processing...' : content.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
