/*jslint devel: true, browser: true, white: false, maxerr: 50, indent: 4 */
/*global $: false, getSpotifyApi: false, SHA1: false */

$(document).ready(function () {
    'use strict';
    // not using these yet ... will soon
    // var m = require("sp://import/scripts/api/models");
    // var v = require("sp://import/scripts/api/views");

    // a reference to our spotify API, all calls go through sp!
    var sp = getSpotifyApi(1),
        // some vars we need to keep track of global state
        currentSong,
        currentChannel,
        // our functions
        getChannelConfig,
        init,
        getTrackFromSpotifyURI,
        updateCurrentSong,
        updateChannel,
        getUsername,
        getNickname,
        putChatRoom;

    // gets the default config for a channel
    getChannelConfig = function (chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, chatitroller, sp) {

        return {
            channelID: chatChannel.toLowerCase().replace(/ /g, "-"),
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
            oAuthProviders: [
                { "name": "facebook" },
                { "name": "twitter" },
                { "name": "tumblr" }
            ],
            loginMessage: loginMessage,
            logoutMessage: logoutMessage,
            logoutButtonText: "exit",
            loggedIn: loggedIn,
            logoutCallback: logoutCallback,
            chatitroller: chatitroller,
            formatMessages: false,
            linkifyMessages: true,
            enableChannelLogin: false,
            sp: sp
        };
    };


    // init, nuff said
    init = function () {

        var chatChannel = "spotify",
            playerTrackInfo = sp.trackPlayer.getNowPlayingTrack(),
            $controller;

        // Set our sessionID
        localStorage.setItem('SESSIONID', SHA1(Date() + getUsername()));

        if (playerTrackInfo !== null) {
            chatChannel = playerTrackInfo.track.artists[0].name;
        }

        $controller = $(".chatify-channels").chatitroller({
            chatifyClass: 'chatify-channel',
            channelCountMax: 2
        });

        sp.trackPlayer.addEventListener("playerStateChanged", function (event) {
            // Only update the page if the track changed
            if (event.data.curtrack === true) {
                updateChannel();
            }
        });

        sp.core.addEventListener("linksChanged", function (event) {
            // We dropped something on the sidebar icon
            console.log(event.data);
        });

        putChatRoom($controller, chatChannel, playerTrackInfo);

        $(document).delegate('a', "click", function (event) {

            var $link = $(this);

            if ($link.hasClass('song-link')) {
                sp.copy($link.attr('href'));
                event.preventDefault();
            }
        });

        currentChannel = chatChannel;
    };


    // we are using raw links in our messages and displaying pretty track links on client load
    getTrackFromSpotifyURI = function (spotifyURI, onSuccess, onFailure, onComplete) {

        sp.core.getMetadata(spotifyURI, {
            onSuccess: function (result) { if (onSuccess) { onSuccess(result); } },
            onFailure: function (error) { if (onFailure) { onFailure(error); } },
            onComplete: function () { if (onComplete) { onComplete(); } }
        });
    };


    // updates the current song on the server to push to other listeners
    // TODO
    updateCurrentSong = function () {

        var chatChannel = 'spotify',
            $controller = $(".chatify-channels"),
            playerTrackInfo = sp.trackPlayer.getNowPlayingTrack(),
            currentUser = getUsername(),
            nickname = getNickname(),
            loginMessage = currentUser + " has entered the room.",
            loggedIn =  $controller.chatitroller("getLoggedIn"),
            logoutMessage = nickname + " has left the room.",
            songuri,
            logoutCallback;

        console.log("updating song");
        console.log(playerTrackInfo);

        if (playerTrackInfo !== null) {
            chatChannel = playerTrackInfo.track.artists[0].name;
            songuri = playerTrackInfo.track.uri;
            loginMessage = nickname + " has entered the room listening to " + songuri + ".";
        }

        $(".chatify-channels").chatitroller("addChannel", getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, $controller, sp));
        currentChannel = chatChannel;
        currentSong = songuri;
    };


    // checks if we should be in the same room still, and changes us if neccessary
    updateChannel = function () {

        var chatChannel = 'spotify',
            $controller = $(".chatify-channels"),
            playerTrackInfo = sp.trackPlayer.getNowPlayingTrack(),
            currentUser = getUsername(),
            nickname = getNickname(),
            // define our message here and send to server for push notifications
            loginMessage = currentUser + " has entered the room.",
            loggedIn =  $controller.chatitroller("getLoggedIn"),
            logoutMessage = nickname + " has left the room.",
            logoutCallback,
            songuri;

        console.log("updating channel");
        console.log(playerTrackInfo);

        if (playerTrackInfo !== null) {
            chatChannel = playerTrackInfo.track.artists[0].name;
            songuri = playerTrackInfo.track.uri;
            loginMessage = nickname + " has entered the room listening to " + songuri + ".";
        }

        $(".chatify-channels").chatitroller("addChannel", getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, $controller, sp));
    };


    // well, get our unique userId, not really a name.
    // We need to earn Facebooks trust ourselves
    getUsername = function () {

        var username;

        username = sp.core.getAnonymousUserId();
        return username;
    };


    // This will be set if we are logged in, which we must be
    getNickname = function () {

        return localStorage.getItem('nickname');
    };


    // create a room and display it
    // most of the work is done in our plugins, just place it in the right spot 
    // and call it with the right config here
    putChatRoom = function ($controller, chatChannel, playerTrackInfo) {

        var currentUser = getUsername(),
            loginMessage = currentUser + " has entered the room.",
            logoutMessage = currentUser + " has left the room.",
            loggedIn =  $controller.chatitroller("getLoggedIn"),
            logoutCallback,
            songuri;


        if (playerTrackInfo !== null) {
            songuri = playerTrackInfo.track.uri;
            loginMessage = currentUser + " has entered the room listening to " + songuri + ".";
        }

        // we should always use our controller to add/remove rooms
        $controller.chatitroller('addChannel', getChannelConfig(chatChannel, currentUser, loggedIn, loginMessage, logoutMessage, logoutCallback, $controller, sp));
    };

    // OK, start us up
    init();

});
