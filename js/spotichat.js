function getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage) {
  return {
        channelID: chatChannel.replace(" ","-").toLowerCase(),
        chatElements: ".chat-container, .logout-button",
        chatContainer: "chat-container",
        messageContainer: "message-container",
        loginButton: "login-button",
        logoutButton: "logout-button",
        channelName: "channel-name",
        channelHeader: "channel-header",
        loginElements: ".login-container",
        loginContainer: "login-container",
        loginErrors: "login-errors",
        usernameField: "nickname",
        usernameDisplay: "current-username",
        sendMessageButton: "send-button",
        composeMessageField: "message",
        chatErrors: "chat-errors",
        messageTemplate: $("#message-template").html(),
        channelTemplate: $("#channel-template").html(),
        chatServerURL: "http://www.spotichat.com/api",
        chatChannel: chatChannel,
        chatUsername: currentUser,
        loginMessage: loginMessage,
        logoutMessage: logoutMessage,
        loggedIn: loggedIn
    };
}
  
function init(spotichat) {
  var chatChannel = "spotify";
  var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
  if( playerTrackInfo != null ) {
    chatChannel = playerTrackInfo.track.artists[0].name;
  }
  putChatRoom(chatChannel, playerTrackInfo);
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
    //console.log("updating channel");
    var chatChannel = 'spotify';
    var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
    var currentUser = getUsername();
    var loginMessage = currentUser + " has entered the room.";
    var loggedIn =  $(".chatify-channels").chatitroller("getLoggedIn");
    
    if(playerTrackInfo != null) {
      chatChannel = playerTrackInfo.track.artists[0].name;
      var songuri = playerTrackInfo.track.uri;
      loginMessage = currentUser + " has entered the room listening to " + songuri + ".";
    }
    var logoutMessage = currentUser + " has left the room.";
    $(".chatify-channels").chatitroller("addChannel", getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage));    
}

function getUsername() {
  var username = null;
  //var playlists = sp.core.library.getPlaylists();

  //if( playlists.length > 0 ) {
  //  username = playlists[0].uri.split(":")[2];
  //} else {
  // var lib = sp.core.library;
  // playlist = lib.createPlaylist(name, [], 0);
  // username = playlist.uri.split(":")[2];
  // lib.removePlaylist(0);
  //  
  //}
  //return username;
  username = sp.core.getAnonymousUserId();
  return username;
}
function putChatRoom(chatChannel, playerTrackInfo) {
  var currentUser = getUsername();
  var loginMessage = currentUser + " has entered the room.";
  if(playerTrackInfo != null) {
      var songuri = playerTrackInfo.track.uri;
      loginMessage = currentUser + " has entered the room listening to " + songuri + ".";
  }
  var logoutMessage = currentUser + " has left the room.";

  var loggedIn =  $(".chatify-channels").chatitroller("getLoggedIn");
 
  $(".chatify-channel").chatify(getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage));

  $(".chatify-channels").chatitroller({
    chatifyClass: 'chatify-channel',
    channelCountMax: 2
  });

}

var m = require("sp://import/scripts/api/models");
var v = require("sp://import/scripts/api/views");
var sp = getSpotifyApi(1);
exports.init = init;
exports.getUsername = getUsername;
exports.getTrackFromSpotifyURI = getTrackFromSpotifyURI ;
exports.m = m;
exports.v = v;