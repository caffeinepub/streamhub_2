import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Video, Comment, UserProfile, Report, AdminAction, PlatformSettings } from '../backend';
import { Principal } from '@dfinity/principal';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Video Queries
export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['trendingVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingVideos();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videosByCategory', category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useSearchVideos(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['searchVideos', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchVideos(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm && searchTerm.length > 0,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      videoFile,
      thumbnail,
      category,
    }: {
      id: string;
      title: string;
      description: string;
      videoFile: ExternalBlob;
      thumbnail: ExternalBlob | null;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(id, title, description, videoFile, thumbnail, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
    },
  });
}

// Like System
export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
    },
  });
}

// Comment System
export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(videoId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, commentId }: { videoId: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(videoId, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// Subscription System
export function useSubscribeToChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.subscribeToChannel(Principal.fromText(channelId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// Playlist System
export function useCreatePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlaylist(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

export function useAddVideoToPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistName, videoId }: { playlistName: string; videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVideoToPlaylist(playlistName, videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

// Report System
export function useReportVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reason }: { videoId: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportVideo(videoId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['searchUsers', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchUsers(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm && searchTerm.length > 0,
  });
}

export function useGetUserStatistics(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userStatistics', userId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserStatistics(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetPlatformStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllReports() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, Report[]]>>({
    queryKey: ['allReports'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReports();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
  });
}

export function useGetVideoReports(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['videoReports', videoId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideoReports(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useRemoveReportedVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeReportedVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
    },
  });
}

// User Management
export function useSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, reason }: { user: Principal; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.suspendUser(user, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, reason }: { user: Principal; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.banUser(user, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    },
  });
}

export function useRestoreUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.restoreUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    },
  });
}

// Video Management
export function useBulkRemoveVideos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoIds: string[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkRemoveVideos(videoIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    },
  });
}

export function useBulkHideVideos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoIds: string[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkHideVideos(videoIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
    },
  });
}

export function useBulkFeatureVideos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoIds: string[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkFeatureVideos(videoIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
    },
  });
}

// Admin Activity Log
export function useGetAdminActivityLog(limit: number) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminAction[]>({
    queryKey: ['adminActivityLog', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdminActivityLog(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
  });
}

// Platform Settings
export function useGetPlatformSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<PlatformSettings>({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPlatformSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePlatformSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: PlatformSettings) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePlatformSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivityLog'] });
    },
  });
}
