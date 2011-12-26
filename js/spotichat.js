$.cookie("test","123");
function getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, chatitroller, sp) {
  return {
        channelID: chatChannel.toLowerCase().replace( / /g,"-"),
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
        agreeCheckbox: "agree-checkbox",
        usernameField: "nickname",
        usernameDisplay: "current-username",
        sendMessageButton: "send-button",
        composeMessageField: "message",
        inputContainer: "input-container",
        chatErrors: "chat-errors",
        messageTemplate: $("#message-template").html(),
        channelTemplate: $("#channel-template").html(),
        chatServerUrl: "http://spotichat.com",
        chatChannel: chatChannel,
        chatUsername: currentUser,
        oAuthProvider: 'facebook',
        loginMessage: loginMessage,
        logoutMessage: logoutMessage,
        logoutButtonText: "exit",
        loggedIn: loggedIn,
        logoutCallback: logoutCallback,
        chatitroller: chatitroller,
        formatMessages: false,
        linkifyMessages: true,
        sp: sp
    };
}
  
function init(spotichat) {
  var chatChannel = "spotify";
  var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
  if( playerTrackInfo != null ) {
    chatChannel = playerTrackInfo.track.artists[0].name;
  }

  var $controller = $(".chatify-channels").chatitroller({
    chatifyClass: 'chatify-channel',
    channelCountMax: 2
  });

  sp.trackPlayer.addEventListener("playerStateChanged", function (event) {
    // Only update the page if the track changed
    if (event.data.curtrack == true) {
        updateChannel();
    }
  });

  sp.core.addEventListener("linksChanged", function (event) {
    // We dropped something on the sidebar icon
    console.log(event.data);
  });

  putChatRoom($controller, chatChannel, playerTrackInfo);
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
    var chatChannel = 'spotify';
    var $controller = $(".chatify-channels");
    
    var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
    var currentUser = getUsername();
    var nickname = getNickname();
    var loginMessage = currentUser + " has entered the room.";
    var loggedIn =  $controller.chatitroller("getLoggedIn");
    console.log(playerTrackInfo);
    if(playerTrackInfo != null) {
      chatChannel = playerTrackInfo.track.artists[0].name;
      var songuri = playerTrackInfo.track.uri;
      loginMessage = nickname + " has entered the room listening to " + songuri + ".";
    }
    var logoutMessage = nickname + " has left the room.";
    var logoutCallback = null;

    $(".chatify-channels").chatitroller("addChannel", getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, $controller, sp));    
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

function getNickname() {
    return localStorage.getItem('nickname');
}

function putChatRoom($controller, chatChannel, playerTrackInfo) {
  var currentUser = getUsername();
  var loginMessage = currentUser + " has entered the room.";
  if(playerTrackInfo != null) {
      var songuri = playerTrackInfo.track.uri;
      loginMessage = currentUser + " has entered the room listening to " + songuri + ".";
  }
  var logoutMessage = currentUser + " has left the room.";

  var loggedIn =  $controller.chatitroller("getLoggedIn");
  var logoutCallback = null;
  
  //$(".chatify-channel").chatify(getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, sp));

  // we should always use our controller to add/remove rooms
  $controller.chatitroller( 'addChannel', getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, $controller, sp) );
}

var m = require("sp://import/scripts/api/models");
var v = require("sp://import/scripts/api/views");
var sp = getSpotifyApi(1);
exports.init = init;
exports.getUsername = getUsername;
exports.getTrackFromSpotifyURI = getTrackFromSpotifyURI ;
exports.m = m;
exports.v = v;
