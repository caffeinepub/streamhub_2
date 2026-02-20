import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
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

  // Report data
  type Report = {
    videoId : Text;
    reporter : Principal;
    reason : Text;
    timestamp : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let videos = Map.empty<Text, Video>();
  let videoComments = Map.empty<Text, List.List<Comment>>();
  let videoLikes = Map.empty<Text, Nat>();
  let userPlaylists = Map.empty<Principal, List.List<Playlist>>();
  let userSubscriptions = Map.empty<Principal, List.List<Principal>>();
  let videoReports = Map.empty<Text, List.List<Report>>();
  var commentIdCounter : Nat = 0;

  // Profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Video upload
  public shared ({ caller }) func uploadVideo(id : Text, title : Text, description : Text, videoFile : Storage.ExternalBlob, thumbnail : ?Storage.ExternalBlob, category : Text) : async Video {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload videos");
    };

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
    };

    videos.add(id, video);
    video;
  };

  // Delete video (owner or admin only)
  public shared ({ caller }) func deleteVideo(videoId : Text) : async () {
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        if (video.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only video owner or admin can delete videos");
        };
        videos.remove(videoId);
        videoComments.remove(videoId);
        videoLikes.remove(videoId);
        videoReports.remove(videoId);
      };
    };
  };

  // Like a video
  public shared ({ caller }) func likeVideo(videoId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like videos");
    };

    let currentLikes = switch (videoLikes.get(videoId)) {
      case (null) { 0 };
      case (?count) { count };
    };

    let newLikes = currentLikes + 1;
    videoLikes.add(videoId, newLikes);
    newLikes;
  };

  // Add comment
  public shared ({ caller }) func addComment(videoId : Text, text : Text) : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
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
            if (comment.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only comment owner or admin can delete comments");
            };
            
            let filteredComments = commentArray.filter(func(c : Comment) : Bool { not Text.equal(c.id, commentId) });
            let newList = List.empty<Comment>();
            for (c in filteredComments.vals()) {
              newList.add(c);
            };
            videoComments.add(videoId, newList);
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

  // Create playlist
  public shared ({ caller }) func createPlaylist(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };

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

  // Report video
  public shared ({ caller }) func reportVideo(videoId : Text, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report videos");
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
  };

  // Admin: Get all users
  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    userProfiles.entries().toArray();
  };

  // Admin: Get platform statistics
  public query ({ caller }) func getPlatformStats() : async {
    totalUsers : Nat;
    totalVideos : Nat;
    totalReports : Nat;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view statistics");
    };

    {
      totalUsers = userProfiles.size();
      totalVideos = videos.size();
      totalReports = videoReports.size();
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
    videos.values().toArray().sort(Video.compareByViews);
  };

  // Public query - accessible to all including guests
  public query ({ caller }) func getVideosByCategory(category : Text) : async [Video] {
    videos.values().toArray().filter(func(v) { Text.equal(v.category, category) });
  };

  // Public query - accessible to all including guests
  public query ({ caller }) func searchVideos(searchTerm : Text) : async [Video] {
    videos.values().toArray().filter(
      func(v) {
        v.title.contains(#text searchTerm) or v.description.contains(#text searchTerm)
      }
    );
  };
};
