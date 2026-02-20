import { useState } from 'react';
import { useGetTrendingVideos, useBulkRemoveVideos, useBulkHideVideos, useBulkFeatureVideos } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BulkActionDialog from './BulkActionDialog';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import type { Video } from '../backend';

const categories = ['All', 'Education', 'Entertainment', 'Music', 'Gaming', 'News', 'Sports', 'Technology'];

export default function VideoManagementTable() {
  const { data: allVideos = [], isLoading } = useGetTrendingVideos();
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bulkAction, setBulkAction] = useState<'remove' | 'hide' | 'feature' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter videos
  const filteredVideos = allVideos.filter((video) => {
    const categoryMatch = categoryFilter === 'All' || video.category === categoryFilter;
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'hidden' && video.hidden) ||
      (statusFilter === 'featured' && video.featured) ||
      (statusFilter === 'normal' && !video.hidden && !video.featured);
    return categoryMatch && statusMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + itemsPerPage);

  const toggleVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const toggleAll = () => {
    if (selectedVideos.size === paginatedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(paginatedVideos.map((v) => v.id)));
    }
  };

  const handleBulkAction = (action: 'remove' | 'hide' | 'feature') => {
    if (selectedVideos.size === 0) return;
    setBulkAction(action);
  };

  const closeBulkDialog = () => {
    setBulkAction(null);
    setSelectedVideos(new Set());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Video Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Bulk Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('hide')}
                disabled={selectedVideos.size === 0}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Hide ({selectedVideos.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('feature')}
                disabled={selectedVideos.size === 0}
              >
                <Star className="h-4 w-4 mr-1" />
                Feature ({selectedVideos.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('remove')}
                disabled={selectedVideos.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove ({selectedVideos.size})
              </Button>
            </div>
          </div>

          {/* Video Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading videos...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No videos found</div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVideos.length)} of {filteredVideos.length} videos
                {selectedVideos.size > 0 && ` • ${selectedVideos.size} selected`}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedVideos.size === paginatedVideos.length && paginatedVideos.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVideos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVideos.has(video.id)}
                            onCheckedChange={() => toggleVideo(video.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={video.thumbnail?.getDirectURL() || '/assets/generated/video-placeholder.dim_640x360.png'}
                              alt={video.title}
                              className="w-20 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium line-clamp-1">{video.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{video.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{video.views.toString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(Number(video.uploadTime) / 1000000).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {video.hidden && <Badge variant="secondary">Hidden</Badge>}
                            {video.featured && <Badge variant="default">Featured</Badge>}
                            {!video.hidden && !video.featured && <Badge variant="outline">Normal</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      {bulkAction && (
        <BulkActionDialog
          action={bulkAction}
          videoIds={Array.from(selectedVideos)}
          open={!!bulkAction}
          onClose={closeBulkDialog}
        />
      )}
    </div>
  );
}
