import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: string;
    title: string;
    featured: boolean;
    thumbnail?: ExternalBlob;
    views: bigint;
    hidden: boolean;
    description: string;
    videoFile: ExternalBlob;
    category: string;
    uploader: Principal;
    uploadTime: Time;
}
export interface PlaylistView {
    name: string;
    videos: Array<string>;
}
export type Time = bigint;
export interface Comment {
    id: string;
    text: string;
    user: Principal;
    timestamp: Time;
}
export interface Report {
    timestamp: Time;
    reporter: Principal;
    reason: string;
    videoId: string;
}
export interface PlatformSettings {
    maxVideoSizeMB: bigint;
    allowedCategories: Array<string>;
    moderationPolicies: string;
}
export interface SuspensionStatus {
    status: Variant_active_banned_suspended;
    admin: Principal;
    timestamp: Time;
    reason: string;
}
export interface AdminAction {
    id: bigint;
    admin: Principal;
    actionType: string;
    timestamp: Time;
    details: string;
    affectedResource: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    email: string;
    profilePicture?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_banned_suspended {
    active = "active",
    banned = "banned",
    suspended = "suspended"
}
export interface backendInterface {
    addComment(videoId: string, text: string): Promise<Comment>;
    addVideoToPlaylist(playlistName: string, videoId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(user: Principal, reason: string): Promise<void>;
    bulkFeatureVideos(videoIds: Array<string>): Promise<void>;
    bulkHideVideos(videoIds: Array<string>): Promise<void>;
    bulkRemoveVideos(videoIds: Array<string>): Promise<void>;
    createPlaylist(name: string): Promise<void>;
    deleteComment(videoId: string, commentId: string): Promise<void>;
    deleteVideo(videoId: string): Promise<void>;
    getAdminActivityLog(limit: bigint): Promise<Array<AdminAction>>;
    getAllReports(): Promise<Array<[string, Array<Report>]>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getCallerSubscriptions(): Promise<Array<Principal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeaturedVideos(): Promise<Array<Video>>;
    getPlatformSettings(): Promise<PlatformSettings>;
    getPlatformStats(): Promise<{
        bannedUsers: bigint;
        totalReports: bigint;
        totalVideos: bigint;
        totalUsers: bigint;
        suspendedUsers: bigint;
    }>;
    getTrendingVideos(): Promise<Array<Video>>;
    getUserPlaylists(user: Principal): Promise<Array<PlaylistView>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStatistics(user: Principal): Promise<{
        accountCreationDate?: Time;
        totalVideos: bigint;
        subscriberCount: bigint;
    }>;
    getUserStatus(user: Principal): Promise<SuspensionStatus>;
    getVideo(videoId: string): Promise<Video | null>;
    getVideoComments(videoId: string): Promise<Array<Comment>>;
    getVideoReports(videoId: string): Promise<Array<Report>>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    isCallerAdmin(): Promise<boolean>;
    likeVideo(videoId: string): Promise<bigint>;
    removeReportedVideo(videoId: string): Promise<void>;
    reportVideo(videoId: string, reason: string): Promise<void>;
    restoreUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchUsers(searchTerm: string): Promise<Array<[Principal, UserProfile]>>;
    searchVideos(searchTerm: string): Promise<Array<Video>>;
    subscribeToChannel(channel: Principal): Promise<void>;
    suspendUser(user: Principal, reason: string): Promise<void>;
    updatePlatformSettings(settings: PlatformSettings): Promise<void>;
    uploadVideo(id: string, title: string, description: string, videoFile: ExternalBlob, thumbnail: ExternalBlob | null, category: string): Promise<Video>;
}
