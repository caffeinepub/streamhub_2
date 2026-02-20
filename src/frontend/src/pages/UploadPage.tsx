import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUploadVideo } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

const CATEGORIES = ['Gaming', 'Music', 'Education', 'Entertainment', 'Sports', 'Technology', 'News', 'Comedy', 'Film', 'Science'];

export default function UploadPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const uploadVideo = useUploadVideo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!identity) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please login to upload videos.</p>
      </div>
    );
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['video/mp4', 'video/quicktime'];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Only MP4 and MOV files are supported');
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !category || !videoFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const videoArrayBuffer = await videoFile.arrayBuffer();
      const videoUint8Array = new Uint8Array(videoArrayBuffer);
      const videoBlob = ExternalBlob.fromBytes(videoUint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      let thumbnailBlob: ExternalBlob | null = null;
      if (thumbnailFile) {
        const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
        const thumbnailUint8Array = new Uint8Array(thumbnailArrayBuffer);
        thumbnailBlob = ExternalBlob.fromBytes(thumbnailUint8Array);
      }

      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await uploadVideo.mutateAsync({
        id: videoId,
        title: title.trim(),
        description: description.trim(),
        videoFile: videoBlob,
        thumbnail: thumbnailBlob,
        category,
      });

      toast.success('Video uploaded successfully!');
      navigate({ to: `/watch/${result.id}` });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your video"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Video File (MP4, MOV) *</Label>
              <Input
                id="video"
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                required
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">{uploadProgress}%</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={uploadVideo.isPending}>
              {uploadVideo.isPending ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
