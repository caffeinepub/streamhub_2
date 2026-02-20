import { useState } from 'react';
import { useGetAdminActivityLog } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

export default function ActivityLogTable() {
  const [limit] = useState(50);
  const { data: activities = [], isLoading } = useGetAdminActivityLog(limit);

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes('BAN') || actionType.includes('REMOVE')) return 'destructive';
    if (actionType.includes('SUSPEND') || actionType.includes('HIDE')) return 'secondary';
    if (actionType.includes('RESTORE') || actionType.includes('FEATURE')) return 'default';
    return 'outline';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activity log...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No admin actions recorded yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id.toString()}>
                      <TableCell className="text-sm">
                        {new Date(Number(activity.timestamp) / 1000000).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0 font-mono text-xs">
                              {activity.admin.toString().slice(0, 8)}...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <p className="text-xs font-mono break-all">{activity.admin.toString()}</p>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(activity.actionType)}>
                          {activity.actionType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{activity.affectedResource}</TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Info className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <p className="text-sm">{activity.details}</p>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
