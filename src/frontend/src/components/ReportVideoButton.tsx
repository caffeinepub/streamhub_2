import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface ReportVideoButtonProps {
  videoId: string;
  isOwner: boolean;
}

export default function ReportVideoButton({ videoId, isOwner }: ReportVideoButtonProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [isOpen, setIsOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      toast.error('Please login to report videos');
      return;
    }

    if (hasReported) {
      toast.info('You have already reported this video');
      return;
    }

    setIsOpen(true);
  };

  const handleReportSuccess = () => {
    setHasReported(true);
    setIsOpen(false);
  };

  if (isOwner) {
    return null;
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleOpenModal} disabled={hasReported}>
        <Flag className="mr-2 h-4 w-4" />
        Report
      </Button>
      <ReportModal
        videoId={videoId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleReportSuccess}
      />
    </>
  );
}
