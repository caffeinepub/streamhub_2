import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Include storage mixin
  include MixinStorage();

  // Include authorization mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profiles
  type UserProfile = {
    username : Text;
    email : Text;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
  };

  // Video data
  public type Video = {
    id : Text;
    title : Text;
    description : Text;
    uploadTime : Time.Time;
    uploader : Principal;
    videoFile : Storage.ExternalBlob;
    thumbnail : ?Storage.ExternalBlob;
    category : Text;
    views : Nat;
    featured : Bool;
    hidden : Bool;
  };

  // Comment data
  public type Comment = {
    id : Text;
    user : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  // Playlist data
  type Playlist = {
    name : Text;
    videos : List.List<Text>;
  };

  // Immutable version of Playlist for public interface
  public type PlaylistView = {
    name : Text;
    videos : [Text];
  };

  // Report data
  type Report = {
    videoId : Text;
    reporter : Principal;
    reason : Text;
    timestamp : Time.Time;
  };

  // Suspension status
  type SuspensionStatus = {
    status : {
      #active;
      #suspended;
      #banned;
    };
    reason : Text;
    admin : Principal;
    timestamp : Time.Time;
  };

  // Admin action log entry
  type AdminAction = {
    id : Nat;
    admin : Principal;
    actionType : Text;
    affectedResource : Text;
    details : Text;
    timestamp : Time.Time;
  };

  // Platform settings
  type PlatformSettings = {
    maxVideoSizeMB : Nat;
    allowedCategories : [Text];
    moderationPolicies : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let videos = Map.empty<Text, Video>();
  let videoComments = Map.empty<Text, List.List<Comment>>();
  let videoLikes = Map.empty<Text, Nat>();
  let userPlaylists = Map.empty<Principal, List.List<Playlist>>();
  let userSubscriptions = Map.empty<Principal, List.List<Principal>>();
  let videoReports = Map.empty<Text, List.List<Report>>();
  let userSuspensions = Map.empty<Principal, SuspensionStatus>();
  let adminActionLog = List.empty<AdminAction>();
  var commentIdCounter : Nat = 0;
  var adminActionCounter : Nat = 0;

  var platformSettings : PlatformSettings = {
    maxVideoSizeMB = 500;
    allowedCategories = ["Education", "Entertainment", "Music", "Gaming", "News", "Sports", "Technology"];
    moderationPolicies = "Default moderation policies";
  };

  // Helper function to check if user is suspended or banned
  private func checkUserStatus(user : Principal) {
    switch (userSuspensions.get(user)) {
      case (?status) {
        switch (status.status) {
          case (#suspended) {
            Runtime.trap("Account suspended: " # status.reason);
          };
          case (#banned) {
            Runtime.trap("Account banned: " # status.reason);
          };
          case (#active) { /* OK */ };
        };
      };
      case (null) { /* OK - no suspension record */ };
    };
  };

  // Helper function to log admin actions
  private func logAdminAction(admin : Principal, actionType : Text, affectedResource : Text, details : Text) {
    adminActionCounter += 1;
    let action : AdminAction = {
      id = adminActionCounter;
      admin;
      actionType;
      affectedResource;
      details;
      timestamp = Time.now();
    };
    adminActionLog.add(action);
  };

  // Profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Admins can view any profile, users can only view their own
    if (not AccessControl.isAdmin(accessControlState, caller) and caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile or must be admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    checkUserStatus(caller);
    userProfiles.add(caller, profile);
  };

  // Video upload
  public shared ({ caller }) func uploadVideo(id : Text, title : Text, description : Text, videoFile : Storage.ExternalBlob, thumbnail : ?Storage.ExternalBlob, category : Text) : async Video {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload videos");
    };
    checkUserStatus(caller);

    let video : Video = {
      id;
      title;
      description;
      uploadTime = Time.now();
      uploader = caller;
      videoFile;
      thumbnail;
      category;
      views = 0;
      featured = false;
      hidden = false;
    };

    videos.add(id, video);
    video;
  };

  // Get single video - public but respects hidden flag (admins can see hidden videos)
  public query ({ caller }) func getVideo(videoId : Text) : async ?Video {
    switch (videos.get(videoId)) {
      case (null) { null };
      case (?video) {
        // Admins can see all videos including hidden ones
        if (video.hidden and not AccessControl.isAdmin(accessControlState, caller)) {
          null;
        } else {
          ?video;
        };
      };
    };
  };

  // Delete video (owner or admin only)
  public shared ({ caller }) func deleteVideo(videoId : Text) : async () {
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let isOwner = video.uploader == caller;
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        if (not isOwner and not isAdmin) {
          Runtime.trap("Unauthorized: Only video owner or admin can delete videos");
        };

        if (isOwner) {
          checkUserStatus(caller);
        };

        videos.remove(videoId);
        videoComments.remove(videoId);
        videoLikes.remove(videoId);
        videoReports.remove(videoId);

        if (isAdmin) {
          logAdminAction(caller, "DELETE_VIDEO", videoId, "Video deleted by admin");
        };
      };
    };
  };

  // Like a video
  public shared ({ caller }) func likeVideo(videoId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like videos");
    };
    checkUserStatus(caller);

    // Verify video exists and is not hidden
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        if (video.hidden) {
          Runtime.trap("Cannot like hidden video");
        };
      };
    };

    let currentLikes = switch (videoLikes.get(videoId)) {
      case (null) { 0 };
      case (?count) { count };
    };

    let newLikes = currentLikes + 1;
    videoLikes.add(videoId, newLikes);
    newLikes;
  };

  // Get comments for a video - public but respects hidden flag
  public query ({ caller }) func getVideoComments(videoId : Text) : async [Comment] {
    // Check if video exists and is visible
    switch (videos.get(videoId)) {
      case (null) { [] };
      case (?video) {
        if (video.hidden and not AccessControl.isAdmin(accessControlState, caller)) {
          [];
        } else {
          switch (videoComments.get(videoId)) {
            case (null) { [] };
            case (?commentsList) { commentsList.values().toArray() };
          };
        };
      };
    };
  };

  // Add comment
  public shared ({ caller }) func addComment(videoId : Text, text : Text) : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    checkUserStatus(caller);

    // Verify video exists and is not hidden
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        if (video.hidden) {
          Runtime.trap("Cannot comment on hidden video");
        };
      };
    };

    commentIdCounter += 1;
    let comment = {
      id = commentIdCounter.toText();
      user = caller;
      text;
      timestamp = Time.now();
    };

    let commentsList = switch (videoComments.get(videoId)) {
      case (null) { List.empty<Comment>() };
      case (?existing) { existing };
    };

    commentsList.add(comment);
    videoComments.add(videoId, commentsList);
    comment;
  };

  // Delete comment (owner or admin only)
  public shared ({ caller }) func deleteComment(videoId : Text, commentId : Text) : async () {
    switch (videoComments.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?commentsList) {
        let commentArray = commentsList.values().toArray();
        let commentOpt = commentArray.find(func(c : Comment) : Bool { Text.equal(c.id, commentId) });

        switch (commentOpt) {
          case (null) { Runtime.trap("Comment not found") };
          case (?comment) {
            let isOwner = comment.user == caller;
            let isAdmin = AccessControl.isAdmin(accessControlState, caller);

            if (not isOwner and not isAdmin) {
              Runtime.trap("Unauthorized: Only comment owner or admin can delete comments");
            };

            if (isOwner) {
              checkUserStatus(caller);
            };

            let filteredComments = commentArray.filter(func(c : Comment) : Bool { not Text.equal(c.id, commentId) });
            let newList = List.empty<Comment>();
            for (c in filteredComments.vals()) {
              newList.add(c);
            };
            videoComments.add(videoId, newList);

            if (isAdmin) {
              logAdminAction(caller, "DELETE_COMMENT", commentId, "Comment deleted from video " # videoId);
            };
          };
        };
      };
    };
  };

  // Subscribe to a channel
  public shared ({ caller }) func subscribeToChannel(channel : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can subscribe");
    };
    checkUserStatus(caller);

    let subscriptions = switch (userSubscriptions.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?existing) { existing };
    };

    let alreadySubscribed = subscriptions.values().toArray().any(func(p) { p == channel });
    if (alreadySubscribed) {
      Runtime.trap("Already subscribed to this channel");
    };

    subscriptions.add(channel);
    userSubscriptions.add(caller, subscriptions);
  };

  // Get user's subscriptions
  public query ({ caller }) func getCallerSubscriptions() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };

    switch (userSubscriptions.get(caller)) {
      case (null) { [] };
      case (?subscriptions) { subscriptions.values().toArray() };
    };
  };

  // Create playlist
  public shared ({ caller }) func createPlaylist(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };
    checkUserStatus(caller);

    let newPlaylist : Playlist = {
      name;
      videos = List.empty<Text>();
    };

    let playlists = switch (userPlaylists.get(caller)) {
      case (null) { List.empty<Playlist>() };
      case (?existing) { existing };
    };

    playlists.add(newPlaylist);
    userPlaylists.add(caller, playlists);
  };

  // Add video to playlist (owner only)
  public shared ({ caller }) func addVideoToPlaylist(playlistName : Text, videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage playlists");
    };
    checkUserStatus(caller);

    // Verify video exists and is not hidden
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        if (video.hidden) {
          Runtime.trap("Cannot add hidden video to playlist");
        };
      };
    };

    switch (userPlaylists.get(caller)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlists) {
        let updatedPlaylists = playlists.map<Playlist, Playlist>(
          func(p) {
            if (Text.equal(p.name, playlistName)) {
              p.videos.add(videoId);
              p;
            } else {
              p;
            };
          }
        );
        userPlaylists.add(caller, updatedPlaylists);
      };
    };
  };

  // Get user's playlists (owner or admin) - returns immutable snapshot of playlists
  public query ({ caller }) func getUserPlaylists(user : Principal) : async [PlaylistView] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own playlists or must be admin");
    };

    switch (userPlaylists.get(user)) {
      case (null) { [] };
      case (?playlists) {
        playlists.map<Playlist, PlaylistView>(
          func(p) {
            {
              name = p.name;
              videos = p.videos.values().toArray();
            };
          }
        ).toArray();
      };
    };
  };

  // Report video
  public shared ({ caller }) func reportVideo(videoId : Text, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report videos");
    };
    checkUserStatus(caller);

    // Verify video exists
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?_) { /* OK */ };
    };

    let report : Report = {
      videoId;
      reporter = caller;
      reason;
      timestamp = Time.now();
    };

    let reportsList = switch (videoReports.get(videoId)) {
      case (null) { List.empty<Report>() };
      case (?existing) { existing };
    };

    reportsList.add(report);
    videoReports.add(videoId, reportsList);
  };

  // Admin: View all reports
  public query ({ caller }) func getAllReports() : async [(Text, [Report])] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view reports");
    };

    let result = videoReports.entries().toArray().map(
      func((videoId, reportsList)) {
        (videoId, reportsList.values().toArray())
      }
    );
    result;
  };

  // Admin: Get reports for specific video
  public query ({ caller }) func getVideoReports(videoId : Text) : async [Report] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view reports");
    };

    switch (videoReports.get(videoId)) {
      case (null) { [] };
      case (?reportsList) { reportsList.values().toArray() };
    };
  };

  // Admin: Remove reported video
  public shared ({ caller }) func removeReportedVideo(videoId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can remove videos");
    };

    videos.remove(videoId);
    videoComments.remove(videoId);
    videoLikes.remove(videoId);
    videoReports.remove(videoId);

    logAdminAction(caller, "REMOVE_REPORTED_VIDEO", videoId, "Reported video removed");
  };

  // Admin: Get all users with statistics
  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    userProfiles.entries().toArray();
  };

  // Admin: Search users by username or email
  public query ({ caller }) func searchUsers(searchTerm : Text) : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can search users");
    };

    userProfiles.entries().toArray().filter(
      func((principal, profile)) {
        profile.username.contains(#text searchTerm) or profile.email.contains(#text searchTerm)
      }
    );
  };

  // Admin: Get user statistics
  public query ({ caller }) func getUserStatistics(user : Principal) : async {
    totalVideos : Nat;
    subscriberCount : Nat;
    accountCreationDate : ?Time.Time;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user statistics");
    };

    let totalVideos = videos.values().toArray().filter(func(v) { v.uploader == user }).size();

    let subscriberCount = userSubscriptions.values().toArray().filter(
      func(subList) {
        subList.values().toArray().any(func(p) { p == user })
      }
    ).size();

    // Get earliest video upload time as proxy for account creation
    let userVideos = videos.values().toArray().filter(func(v) { v.uploader == user });
    let accountCreationDate = if (userVideos.size() > 0) {
      let sorted = userVideos.sort(func(v1, v2) { Int.compare(v1.uploadTime, v2.uploadTime) });
      ?sorted[0].uploadTime;
    } else {
      null;
    };

    {
      totalVideos;
      subscriberCount;
      accountCreationDate;
    };
  };

  // Admin: Get platform statistics
  public query ({ caller }) func getPlatformStats() : async {
    totalUsers : Nat;
    totalVideos : Nat;
    totalReports : Nat;
    suspendedUsers : Nat;
    bannedUsers : Nat;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view statistics");
    };

    let suspendedUsers = userSuspensions.values().toArray().filter(
      func(status) {
        switch (status.status) {
          case (#suspended) { true };
          case (_) { false };
        };
      }
    ).size();

    let bannedUsers = userSuspensions.values().toArray().filter(
      func(status) {
        switch (status.status) {
          case (#banned) { true };
          case (_) { false };
        };
      }
    ).size();

    {
      totalUsers = userProfiles.size();
      totalVideos = videos.size();
      totalReports = videoReports.size();
      suspendedUsers;
      bannedUsers;
    };
  };

  // Admin: Suspend user
  public shared ({ caller }) func suspendUser(user : Principal, reason : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can suspend users");
    };

    let suspensionStatus : SuspensionStatus = {
      status = #suspended;
      reason;
      admin = caller;
      timestamp = Time.now();
    };

    userSuspensions.add(user, suspensionStatus);
    logAdminAction(caller, "SUSPEND_USER", user.toText(), "User suspended: " # reason);
  };

  // Admin: Ban user
  public shared ({ caller }) func banUser(user : Principal, reason : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };

    let banStatus : SuspensionStatus = {
      status = #banned;
      reason;
      admin = caller;
      timestamp = Time.now();
    };

    userSuspensions.add(user, banStatus);
    logAdminAction(caller, "BAN_USER", user.toText(), "User banned: " # reason);
  };

  // Admin: Restore user
  public shared ({ caller }) func restoreUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can restore users");
    };

    let activeStatus : SuspensionStatus = {
      status = #active;
      reason = "Restored by admin";
      admin = caller;
      timestamp = Time.now();
    };

    userSuspensions.add(user, activeStatus);
    logAdminAction(caller, "RESTORE_USER", user.toText(), "User account restored");
  };

  // Admin: Bulk hide videos
  public shared ({ caller }) func bulkHideVideos(videoIds : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can hide videos");
    };

    for (videoId in videoIds.vals()) {
      switch (videos.get(videoId)) {
        case (?video) {
          let updatedVideo = {
            video with
            hidden = true;
          };
          videos.add(videoId, updatedVideo);
        };
        case (null) { /* Skip non-existent videos */ };
      };
    };

    logAdminAction(caller, "BULK_HIDE_VIDEOS", videoIds.size().toText() # " videos", "Videos hidden in bulk");
  };

  // Admin: Bulk feature videos
  public shared ({ caller }) func bulkFeatureVideos(videoIds : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can feature videos");
    };

    for (videoId in videoIds.vals()) {
      switch (videos.get(videoId)) {
        case (?video) {
          let updatedVideo = {
            video with
            featured = true;
          };
          videos.add(videoId, updatedVideo);
        };
        case (null) { /* Skip non-existent videos */ };
      };
    };

    logAdminAction(caller, "BULK_FEATURE_VIDEOS", videoIds.size().toText() # " videos", "Videos featured in bulk");
  };

  // Admin: Bulk remove videos
  public shared ({ caller }) func bulkRemoveVideos(videoIds : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can remove videos");
    };

    for (videoId in videoIds.vals()) {
      videos.remove(videoId);
      videoComments.remove(videoId);
      videoLikes.remove(videoId);
      videoReports.remove(videoId);
    };

    logAdminAction(caller, "BULK_REMOVE_VIDEOS", videoIds.size().toText() # " videos", "Videos removed in bulk");
  };

  // Admin: Get admin activity log
  public query ({ caller }) func getAdminActivityLog(limit : Nat) : async [AdminAction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view activity log");
    };

    let allActions = adminActionLog.values().toArray();
    let sortedActions = allActions.sort(func(a1, a2) { Int.compare(a2.timestamp, a1.timestamp) });
    let endIndex = Nat.min(limit, sortedActions.size());
    sortedActions.sliceToArray(0, endIndex);
  };

  // Admin: Get platform settings
  public query ({ caller }) func getPlatformSettings() : async PlatformSettings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view platform settings");
    };

    platformSettings;
  };

  // Admin: Update platform settings
  public shared ({ caller }) func updatePlatformSettings(settings : PlatformSettings) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update platform settings");
    };

    platformSettings := settings;
    logAdminAction(caller, "UPDATE_PLATFORM_SETTINGS", "Platform Settings", "Platform settings updated");
  };

  // Check user status (accessible to users for their own status, admins for any user)
  public query ({ caller }) func getUserStatus(user : Principal) : async SuspensionStatus {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own status or must be admin");
    };

    switch (userSuspensions.get(user)) {
      case (?status) { status };
      case (null) {
        {
          status = #active;
          reason = "";
          admin = user;
          timestamp = 0;
        };
      };
    };
  };

  // Trending logic
  module Video {
    public func compareByViews(video1 : Video, video2 : Video) : Order.Order {
      Nat.compare(video2.views, video1.views);
    };
  };

  // Public query - accessible to all including guests
  public query ({ caller }) func getTrendingVideos() : async [Video] {
    videos.values().toArray().filter(func(v) { not v.hidden }).sort(Video.compareByViews);
  };

  // Public query - accessible to all including guests
  public query ({ caller }) func getVideosByCategory(category : Text) : async [Video] {
    videos.values().toArray().filter(func(v) { Text.equal(v.category, category) and not v.hidden });
  };

  // Public query - accessible to all including guests
  public query ({ caller }) func searchVideos(searchTerm : Text) : async [Video] {
    videos.values().toArray().filter(
      func(v) {
        not v.hidden and (v.title.contains(#text searchTerm) or v.description.contains(#text searchTerm))
      }
    );
  };

  // Public query - get featured videos
  public query ({ caller }) func getFeaturedVideos() : async [Video] {
    videos.values().toArray().filter(func(v) { v.featured and not v.hidden });
  };
};
