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
    thumbnail?: ExternalBlob;
    views: bigint;
    description: string;
    videoFile: ExternalBlob;
    category: string;
    uploader: Principal;
    uploadTime: Time;
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
export interface backendInterface {
    addComment(videoId: string, text: string): Promise<Comment>;
    addVideoToPlaylist(playlistName: string, videoId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlaylist(name: string): Promise<void>;
    deleteComment(videoId: string, commentId: string): Promise<void>;
    deleteVideo(videoId: string): Promise<void>;
    getAllReports(): Promise<Array<[string, Array<Report>]>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPlatformStats(): Promise<{
        totalReports: bigint;
        totalVideos: bigint;
        totalUsers: bigint;
    }>;
    getTrendingVideos(): Promise<Array<Video>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoReports(videoId: string): Promise<Array<Report>>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    isCallerAdmin(): Promise<boolean>;
    likeVideo(videoId: string): Promise<bigint>;
    removeReportedVideo(videoId: string): Promise<void>;
    reportVideo(videoId: string, reason: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchVideos(searchTerm: string): Promise<Array<Video>>;
    subscribeToChannel(channel: Principal): Promise<void>;
    uploadVideo(id: string, title: string, description: string, videoFile: ExternalBlob, thumbnail: ExternalBlob | null, category: string): Promise<Video>;
}
