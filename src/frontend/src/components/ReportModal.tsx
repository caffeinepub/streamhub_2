import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useReportVideo } from '../hooks/useQueries';
import { toast } from 'sonner';

interface ReportModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Copyright violation',
  'Harassment or bullying',
  'Hate speech',
  'Violence or dangerous content',
  'Other',
];

export default function ReportModal({ videoId, isOpen, onClose, onSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const reportVideo = useReportVideo();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    const reason = additionalInfo
      ? `${selectedReason}: ${additionalInfo}`
      : selectedReason;

    try {
      await reportVideo.mutateAsync({ videoId, reason });
      toast.success('Video reported successfully');
      onSuccess();
      setSelectedReason('');
      setAdditionalInfo('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to report video');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Video</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this video.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Reason for reporting</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional information (optional)</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Provide more details..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={reportVideo.isPending}>
            {reportVideo.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
