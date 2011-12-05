function init(spotichat) {
  var chatChannel = "spotify";
  var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
  if( playerTrackInfo != null ) {
    chatChannel = playerTrackInfo.track.artists[0].name;
  }
  Chat.buildChatWindow({
    chatElements: "#chat-container, #logout-button",
    messageContainer: "#message-container",
    loginButton: "#login-button",
    logoutButton: "#logout-button",
    loginElements: "#login-container",
    loginErrors: "#login-errors",
    usernameField: "#nickname",
    usernameDisplay: "#current-username",
    sendMessageButton: "#send-button",
    composeMessageField: "#message",
    chatErrors: "#chat-errors",
    messageTemplate: $("#message-template").html(),
    chatServerURL: "http://www.spotichat.com",
    chatChannel: chatChannel,
    chatUsername: getUsername(),
    spotichat: spotichat,
    playerTrackInfo: playerTrackInfo
  });

  sp.trackPlayer.addEventListener("playerStateChanged", function (event) {
    // Only update the page if the track changed
    if (event.data.curtrack == true) {
        updateChannel();
    }
  });  
}

function getTrackFromSpotifyURI(spotifyURI, callback) {
    sp.core.getMetadata(spotifyURI, {
        onSuccess: function( result ) { callback(result); },
        onFailure: function( result ) { callback(null); },
        onComplete: function( result ) { done = true; }
    });  
}

function updateChannel() {
    console.log("updating channel");
    var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
    console.log(playerTrackInfo);
    Chat.updateNowPlaying(playerTrackInfo);
    
}

function getUsername() {
  var username = null;
  var playlists = sp.core.library.getPlaylists();

  if( playlists.length > 0 ) {
    username = playlists[0].uri.split(":")[2];
  } else {
   var lib = sp.core.library;
   playlist = lib.createPlaylist(name, [], 0);
   username = playlist.uri.split(":")[2];
   lib.removePlaylist(0);
    
  }
  return username;
}
var m = require("sp://import/scripts/api/models");
var v = require("sp://import/scripts/api/views");
var sp = getSpotifyApi(1);
exports.init = init;
exports.getUsername = getUsername;
exports.getTrackFromSpotifyURI = getTrackFromSpotifyURI ;
exports.m = m;
exports.v = v;