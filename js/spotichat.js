// Wrap us in jquery to keep scope and avoid global vars
// does require alread do this?
$(document).ready(function() {

    // not using these yet ... will soon
    //var m = require("sp://import/scripts/api/models");
    //var v = require("sp://import/scripts/api/views");
    
    // a reference to our spotify API, all calls go through sp!
    var sp = getSpotifyApi(1);

    // shouldn't need to export anything, all roads lead from here
    //exports.getUsername = getUsername;
    //exports.getTrackFromSpotifyURI = getTrackFromSpotifyURI ;

    // some vars we need to keep track of global state
    var currentSong = null;
    var currentChannel = null;


    // gets the default config for a channel
    var getChannelConfig = function(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, chatitroller, sp) {
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


    // init, nuff said
    var init = function() {
      var chatChannel = "spotify";
      var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
    
      // Set our sessionID
      localStorage.setItem('SESSIONID', SHA1(Date() + getUsername()));
    
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


    // we are using raw links in our messages and displaying pretty track links on client load
    var getTrackFromSpotifyURI = function(spotifyURI, callback) {
        sp.core.getMetadata(spotifyURI, {
            onSuccess: function( result ) { callback(result); },
            onFailure: function( result ) { callback(null); },
            onComplete: function( result ) { done = true; }
        });  
    }


    // updates the current song on the server to push to other listeners
    // TODO
    var updateCurrentSong = function() {
        console.log("updating song");
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


    // checks if we should be in the same room still, and changes us if neccessary
    var updateChannel = function() {
        console.log("updating channel");
        var chatChannel = 'spotify';
        var $controller = $(".chatify-channels");
        
        var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
        var currentUser = getUsername();
        var nickname = getNickname();
        // define our message here and send to server for push notifications
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


    // well, get our unique userId, not really a name.
    // We need to earn Facebooks trust ourselves
    var getUsername = function() {
      var username = null;
      username = sp.core.getAnonymousUserId();
      return username;
    }


    // This will be set if we are logged in, which we must be
    var getNickname = function() {
        return localStorage.getItem('nickname');
    }


    // create a room and display it
    // most of the work is done in our plugins, just place it in the right spot 
    // and call it with the right config here
    var putChatRoom = function($controller, chatChannel, playerTrackInfo) {
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


    // OK, start us up
    init();


});
