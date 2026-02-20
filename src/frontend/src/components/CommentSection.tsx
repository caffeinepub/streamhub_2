import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';
import { useAddComment, useDeleteComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { Comment } from '../backend';

interface CommentSectionProps {
  videoId: string;
  comments: Comment[];
}

export default function CommentSection({ videoId, comments }: CommentSectionProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await addComment.mutateAsync({ videoId, text: commentText.trim() });
      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ videoId, commentId });
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete comment');
    }
  };

  const isCommentAuthor = (comment: Comment) => {
    if (!identity) return false;
    return comment.user.toString() === identity.getPrincipal().toString();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{comments.length} Comments</h3>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={addComment.isPending}>
            {addComment.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{comment.user.toString().slice(0, 8)}...</span>
                    {isCommentAuthor(comment) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleteComment.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {new Date(Number(comment.timestamp) / 1000000).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
