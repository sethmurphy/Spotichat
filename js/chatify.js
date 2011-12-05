var Chat = (function($) {
  var $loginElements;           // elements shown when the user is logged out
  var $loginContainer;          // login container
  var $usernameField;           // allows the user to input a desired username
  var $loginButton;             // element to which a login function is bound
  var $loginErrors;             // an element where we will place login errors

  var $channelContainer;        // the container the channel lives in
  var $chatElements;            // elements shown when the user is logged in
  var $chatContainer;           // the container containing the chat
  var $usernameDisplay;         // shows the user their current username
  var $messageContainer;        // element to hold messages as they arrive
  var messageTemplate;          // a Mustache template for rendering messages
  var channelTemplate;          // a Mustache template for rendering a channel
  var $composeMessageField;     // allows the user to input a chat message
  var $sendMessageButton;       // element to attach a "send message" function to
  var $logoutButton;            // element to which a logout function is bound
  var $chatErrors;              // an element where we will place chat errors

  var username = '';            // holds the currently logged in username.  If this
  var loggedIn = false;
  var lastMessageTimestamp = 0; // Timestamp of the last message received
                                // Timestamp is represented as unix epoch time, in
                                // milliseconds.  Probably should truncate that.

  var chatServerURL;              // the chat server base URL
  var channelID;
  var chatChannel;
  var chatUsername;
  var playerTrackInfo;
  var spotichat;
  // Removes (some) HTML characters to prevent HTML injection.
  var sanitize = function(text) {
    return text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  }

  // Formats the message for display.
  // Replaces newlines with the <br /> element
  // replaces tabs with 2-spaces
  // replaces leading spaces with non-breaking spaces
  // replaces url's with active links (open a new window)
  var format = function(text) {
    return text.replace(/^\t*/, "&nbsp;&nbsp;")
    .replace(/\r\n/g, "<br/>")
    .replace(/\n/g, "<br/>")
    .replace(/\s/g, "&nbsp;")
    .replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
    .replace(/(\b(spotify:track):[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>');
  }

  var replaceSpotifyURIs = function(text) {
    spotify_uris = text.match(/(\b(spotify:track):[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)
    for( spotify_uri in spotify_uris ) {
        
    }
    return spotify_links.length > 0? true: false;
  }

  var formatSpotifyURIlink = function(text, track) {
    text.replace(link, '<a href="' + track.uri + '" target="_blank">' + track.name + '</a>')
  }


  // Scrolls the window to the bottom of the chat dialogue.
  var scrollToEnd = function() {
    $(document).scrollTop($(document).height() + 500);
  }

  // A primitve UI state controller. Call with true to show the "logged in" UI;
  // call with false to show the "logged out" UI.
  var setChatDisplay = function (enabled) {
    $loginElements.toggle(!enabled);
    $chatElements.toggle(enabled);
  }

  // Performs an ajax call to log the user in.  Sends an empty POST request
  // with the username in the request URL.
  var login = function() {
    var desiredUsername = chatUsername; // $.trim($usernameField.val());
    var url = chatServerURL + "/login/" + desiredUsername;
    var data = "channel=" + chatChannel;
    if(playerTrackInfo != null) {
        data = data + "&track_uri=" + playerTrackInfo.track.uri;
    }
    console.log(url);
    $.ajax({
      type: 'POST',
      url: url,
      async: true,
      cache: false,
      timeout: 5000,
      data: data,
      success: function(data){
        username = desiredUsername;
        loggedIn = true;
        $usernameDisplay.text(username);
        setChatDisplay(true);
        $loginErrors.toggle(false);
        $composeMessageField.focus();
        $.cookie("spotichatid", username,{ expires: 7, path: '/', domain: 'spotichat', secure: true });
        $("#current-channel").html(chatChannel);
        poll();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($loginErrors, textStatus, errorThrown);
      }
    });
  };

  // Performs an ajax call to log the user out.  Sends an empty DELETE request
  // with the username in the request URL.
  var logout = function() {
    var data = "channel=" + chatChannel;
    if(playerTrackInfo != null) {
        data = data + "&track_uri=" + playerTrackInfo.track.uri;
    }

    $.ajax({
      type: 'DELETE',
      url: chatServerURL + "/login/" + username,
      async: true,
      cache: false,
      timeout: 30000,
      data: data,
      success: function(data){
        // do nothing, we logout in complete
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {       
        // do nothing, we logout in complete even if we fail
        handleErrors($loginErrors, textStatus, errorThrown);
      },
      complete: function() {
        logoutClient();
      }
    });
  }

  // Performs an ajax call to log the user out.  Sends an empty DELETE request
  // with the username in the request URL.
  var switchChannel = function(newChannel) {
    var currentChannel = chatChannel;
    chatChannel = newChannel;
    console.log("switching channels from " + currentChannel + " to " + newChannel);
    $.ajax({
      type: 'DELETE',
      url: chatServerURL + "/login/" + username,
      async: true,
      cache: false,
      timeout: 30000,
      data: "channel=" + currentChannel,
      success: function(data){
        // do nothing, we logout in complete
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {       
        // do nothing, we logout in complete even if we fail
        handleErrors($loginErrors, textStatus, errorThrown);
      },
      complete: function() {
        login();
      }
    });
  }


  // performs all the local actions needed to log a user out
  // this will get called without logout ajax call when a session is expired
  var logoutClient = function() {
    setChatDisplay(false);    
    username = '';
    loggedIn = false;
    $usernameField.val('');
    $usernameField.focus();
  }

  // Given a list of messages, appends them to the $messageContainer element,
  // according to the Mustache template defined as messageTemplate.
  var displayMessages = function(messages) {
    $(messages).each(function(){
      console.log(this.message);
      this.message = format(sanitize(this.message));
      console.log(this.message);
      $messageContainer.append(renderMessage(this));
      if(this.timestamp && this.timestamp > lastMessageTimestamp) {
        lastMessageTimestamp = this.timestamp;
      }
    });
    scrollToEnd();
  };

  // Renders a message object using the Mustache template stored in the
  // variable channeTemplate.  Formats the timestamp accordingly. */
  var renderMessage = function(message) {
    var date = new Date();
    date.setTime(message.timestamp);
    message.formattedTime = date.toString().split(' ')[4];
    return Mustache.to_html(messageTemplate, message);
  };

  // Renders a channel object using the Mustache template stored in the
  // variable channelTemplate.  Formats the timestamp accordingly. */
  var renderChannel = function(config) {
    return Mustache.to_html(config.channelTemplate, config);
  };

  // Given an input element and a button element, disables the button if the
  // input field is empty.
  var setButtonBehavior = function($inputField, $submitButton){
    var value = $.trim($inputField.val());
    if(value){
      $submitButton.removeAttr("disabled");
    } else {
      $submitButton.attr("disabled", "disabled");
    }
  };

  // processes a send message request.  The message is sent as a POST request,
  // with the message text defined in the POST body.
  var sendMessageClick = function(event) {
    var $this = $(this);    
    var message = $.trim($composeMessageField.val());
    $this.attr("disabled", "disabled");
    $composeMessageField.blur();
    $composeMessageField.attr("disabled", "disabled");

    data = 'nickname=' + username + "&channel=" + chatChannel + '&message=' + message;

    $.post(chatServerURL + '/feed', data)
      .success( function(){
        $composeMessageField.val("");
        $chatErrors.toggle(false);
      })
      .error( function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($chatErrors, textStatus, errorThrown);
      })
      .complete( function(){
        $composeMessageField.removeAttr("disabled");
        $composeMessageField.focus();
        $this.removeAttr("disabled");
      });
    
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  // sends a GET request for new messages.  This function will recurse indefinitely.
  var poll = function() {
    if (!loggedIn) {
      return false;
    }
    $.ajax({
      type: "GET",
      url: chatServerURL + "/feed",
      async: true,
      cache: false,
      timeout: 1200000,
      data: 'since_timestamp=' + lastMessageTimestamp + '&nickname=' + username + "&channel=" + chatChannel,
      success: function(data) {
        displayMessages(data.messages);
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($chatErrors, textStatus, errorThrown);
      },
      complete: function() {
        poll();
      }
    });
  };

  // display our chat errors
  // if the session has timed out, boot them
  // if there is a network error, assume the server is down, boot them
  var handleError = function($errorElement, textStatus, errorThrown) {
        if(errorThrown === 'Authentication failed') {
          logoutClient();
          $loginErrors.text('Authentication failed! Perhaps your session expired.');
          $loginErrors.toggle(true);
        } else if (errorThrown === 'Not found' || errorThrown === 'timeout') {
          logoutClient();
          $loginErrors.text('Chat server can not be found. Perhaps it is down, or you have no network connection.');
          $loginErrors.toggle(true);
        } else {
          if (errorThrown ==='')
            errorThrown = 'Unable to contact server';
          $errorElement.text(errorThrown);
          $errorElement.toggle(true);
        }
  }

  var setChatChannel = function(channelName) {
      chatChannel = channelName;
  };

  var updateNowPlaying = function(plyrTrackInfo) {
      playerTrackInfo = plyrTrackInfo;
      console.log("Chat updateNowPlaying");
      console.log(playerTrackInfo);
      console.log(playerTrackInfo.track.artists[0].name);
      if(playerTrackInfo.track.artists[0].name != chatChannel) {
        console.log("going to switch channel now ... ");
        switchChannel(playerTrackInfo.track.artists[0].name);
      }
  };

  // Our main setup function.  This function performs no dom manipulation directly,
  // so the layout of your page is preserved after it is called. Accepts a
  // config object as its only argument, which is used to specify jQuery
  // selectors of to bind event listeners to, as well as a Mustache template to
  // dictate how a message should be formatted.
  var buildChatWindow = function(config) {
    
    // create our channel from z-mustache
    var channel = renderChannel(config);
    // stick it in the DOM
    $channelContainer = $(config.channelContainer);    
    $channelContainer.html(channel);
    
    
    
    $chatElements = $(config.chatElements);
    $chatContainer = $(config.chatContainer);
    $messageContainer = $( "." + config.messageContainer);
    $loginButton = $( "." + config.loginButton);
    $logoutButton = $(config.logoutButton);
    $loginElements = $(config.loginElements);
    $loginContainer = $(config.loginContainer);
    $loginErrors = $( "." + config.loginErrors);
    $sendMessageButton = $( "." + config.sendMessageButton);
    $composeMessageField = $( "." + config.composeMessageField);
    $usernameField = $( "." + config.usernameField);
    $usernameDisplay = $( "." + config.usernameDisplay);
    $chatErrors = $( "." + config.chatErrors);
    messageTemplate = config.messageTemplate;
    channelTemplate = config.channelTemplate;
    chatServerURL = config.chatServerURL;
    channelID = config.channelID;
    chatChannel = config.chatChannel;
    chatUsername = config.chatUsername;
    spotichat = config.spotichat
    playerTrackInfo = config.playerTrackInfo
    $loginButton.click(function(event) {
      login();
      event.preventDefault();
    });

    $logoutButton.click(function(event) {
      logout();
      event.preventDefault();
    });

    $composeMessageField.keyup(function(event) {
      setButtonBehavior($(this), $sendMessageButton);
    });

    $composeMessageField.keydown(function(event) {
      if(event.keyCode == 13 && !event.shiftKey){
        if($.trim($composeMessageField.val())){
          $sendMessageButton.click();
        } else {
          return false;
        }
      }
    });

    $usernameField.keydown(function(event) {
      if(event.keyCode == 13 ){
        if($.trim($usernameField.val())){
          $loginButton.click();
        }
      }
    });


    $(window).unload(function(event){
      logout();
    });

    $usernameField.keyup(function(event) {
      setButtonBehavior($(this), $loginButton);
    });

    $sendMessageButton.click(function(event) {
      if($.trim($composeMessageField.val()))
        sendMessageClick(event);
    });
  };

  // set a short default timeout
  // we set this for most get requests that need to be longer
  $.ajaxSetup({ timeout: 3000 } );

  return {
    buildChatWindow: buildChatWindow,
    login: login,
    logout: logout,
    setChatChannel: setChatChannel,
    updateNowPlaying: updateNowPlaying
  };
})($);




$(document).ready(function() {
  $("#nickname").focus();
});
