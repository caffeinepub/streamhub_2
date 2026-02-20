import { useState } from 'react';
import { useIsCallerAdmin, useGetPlatformStats } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModerationQueue from '../components/ModerationQueue';
import UserManagementTable from '../components/UserManagementTable';
import VideoManagementTable from '../components/VideoManagementTable';
import ActivityLogTable from '../components/ActivityLogTable';
import PlatformSettingsForm from '../components/PlatformSettingsForm';
import AnalyticsChart from '../components/AnalyticsChart';
import StatsCard from '../components/StatsCard';
import { Users, Video, Flag, UserX, Ban } from 'lucide-react';

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock daily data for charts (in production, this would come from backend)
  const dailyActiveUsers = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: Math.floor(Math.random() * 100) + 50,
  }));

  const newSignups = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    signups: Math.floor(Math.random() * 20) + 5,
  }));

  const videoUploads = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploads: Math.floor(Math.random() * 15) + 2,
  }));

  if (adminLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              icon={Users}
              label="Total Users"
              value={statsLoading ? '...' : stats?.totalUsers.toString() || '0'}
              iconColor="text-blue-500"
            />
            <StatsCard
              icon={Video}
              label="Total Videos"
              value={statsLoading ? '...' : stats?.totalVideos.toString() || '0'}
              iconColor="text-purple-500"
            />
            <StatsCard
              icon={Flag}
              label="Total Reports"
              value={statsLoading ? '...' : stats?.totalReports.toString() || '0'}
              iconColor="text-red-500"
            />
            <StatsCard
              icon={UserX}
              label="Suspended Users"
              value={statsLoading ? '...' : stats?.suspendedUsers.toString() || '0'}
              iconColor="text-orange-500"
            />
            <StatsCard
              icon={Ban}
              label="Banned Users"
              value={statsLoading ? '...' : stats?.bannedUsers.toString() || '0'}
              iconColor="text-red-600"
            />
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              type="line"
              title="Daily Active Users"
              description="User activity over the last 30 days"
              data={dailyActiveUsers}
              dataKey="users"
              xAxisKey="date"
            />
            <AnalyticsChart
              type="area"
              title="New Signups"
              description="New user registrations over the last 30 days"
              data={newSignups}
              dataKey="signups"
              xAxisKey="date"
            />
          </div>

          <AnalyticsChart
            type="bar"
            title="Video Uploads"
            description="Daily video upload activity"
            data={videoUploads}
            dataKey="uploads"
            xAxisKey="date"
          />

          {/* Storage & Bandwidth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">~2.4 TB</div>
                <p className="text-sm text-muted-foreground mt-1">Total platform storage</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bandwidth Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">~850 GB</div>
                <p className="text-sm text-muted-foreground mt-1">Monthly bandwidth consumption</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagementTable />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideoManagementTable />
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <ModerationQueue />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityLogTable />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <PlatformSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
