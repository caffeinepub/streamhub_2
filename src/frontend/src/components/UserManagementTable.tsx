import { useState } from 'react';
import { useGetAllUsers, useSearchUsers, useGetUserStatistics } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Ban, UserX, UserCheck } from 'lucide-react';
import UserActionDialog from './UserActionDialog';
import { Link } from '@tanstack/react-router';
import type { Principal } from '@dfinity/principal';
import type { UserProfile } from '../backend';

export default function UserManagementTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ principal: Principal; profile: UserProfile } | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'restore' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: allUsers = [], isLoading: allUsersLoading } = useGetAllUsers();
  const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchTerm);

  const displayUsers = searchTerm.trim() ? searchResults : allUsers;
  const isLoading = searchTerm.trim() ? searchLoading : allUsersLoading;

  // Pagination
  const totalPages = Math.ceil(displayUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = displayUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleAction = (principal: Principal, profile: UserProfile, action: 'suspend' | 'ban' | 'restore') => {
    setSelectedUser({ principal, profile });
    setActionType(action);
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by username or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* User Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users found matching your search' : 'No users yet'}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Videos</TableHead>
                      <TableHead className="text-center">Subscribers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map(([principal, profile]) => (
                      <UserRow
                        key={principal.toString()}
                        principal={principal}
                        profile={profile}
                        onAction={handleAction}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, displayUsers.length)} of {displayUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      {selectedUser && actionType && (
        <UserActionDialog
          user={selectedUser.principal}
          username={selectedUser.profile.username}
          actionType={actionType}
          open={!!selectedUser}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

function UserRow({
  principal,
  profile,
  onAction,
}: {
  principal: Principal;
  profile: UserProfile;
  onAction: (principal: Principal, profile: UserProfile, action: 'suspend' | 'ban' | 'restore') => void;
}) {
  const { data: stats } = useGetUserStatistics(principal.toString());

  return (
    <TableRow>
      <TableCell>
        <Link
          to="/profile/$userId"
          params={{ userId: principal.toString() }}
          className="font-medium hover:underline"
        >
          {profile.username}
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{profile.email}</TableCell>
      <TableCell className="text-center">{stats?.totalVideos.toString() || '0'}</TableCell>
      <TableCell className="text-center">{stats?.subscriberCount.toString() || '0'}</TableCell>
      <TableCell>
        <Badge variant="outline">Active</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction(principal, profile, 'suspend')}
          >
            <UserX className="h-3 w-3 mr-1" />
            Suspend
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onAction(principal, profile, 'ban')}
          >
            <Ban className="h-3 w-3 mr-1" />
            Ban
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
