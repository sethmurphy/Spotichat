/*********************************************************
 *	This plugin creates a chatify channel client
 *********************************************************/
(function( $ ){

    var methods = {
        init : function( config ) {
            // need to encapsulate these in each item
            // we have no sensible default for most, they need to be defined
            var settings = {
                $loginElements:        null,  // elements shown when the user is logged out
                $loginContainer:       null,  // login container
                $usernameField:        null,  // allows the user to input a desired username
                $logoutButton:         null,  // element to which a logout function is bound
                $loginButton:          null,  // element to which a login function is bound
                $loginErrors:          null,  // an element where we will place login errors

                $channelHeader:        null,  // the header for a channel
                $channelName:          null,  // the name of the channel
                $chatElements:         null,  // elements shown when the user is logged in
                $chatContainer:        null,  // the container containing the chat
                $usernameDisplay:      null,  // shows the user their current username
                $messageContainer:     null,  // element to hold messages as they arrive
                $composeMessageField:  null,  // allows the user to input a chat message
                $sendMessageButton:    null,  // element to attach a "send message" function to
                $logoutButton:         null,  // element to which a logout function is bound
                $chatErrors:           null,  // an element where we will place chat errors

                messageTemplate:       null,  // a Mustache template for rendering messages
                channelTemplate:       null,  // a Mustache template for rendering a channel

                username:              '',    // holds the currently logged in username.  If this
                loggedIn:              false,
                lastMessageTimestamp:  0,     // Timestamp of the last message received
                                              // Timestamp is represented as unix epoch time, in
                                              // milliseconds.  Probably should truncate that.
                chatServerURL:         null,  // the chat server base URL
                channelID:             null,
                chatChannel:           null,
                chatUsername:          null,
                loginMessage:          null,
                logoutMessage:         null

            };
            
            return this.each(function() {
                var $this = $(this), data = $this.data("settings");
    
                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    // set a short default timeout
                    // we set this for most get requests that need to be longer
                    $.ajaxSetup({ timeout: 3000 } );
                    settings = methods.buildChatWindow(settings, config, $this);
                    $this.data("settings",settings);
               }
           });
        },

        /******************************************************
        ** Destroy us, everything
        ******************************************************/
        destroy : function () {
            var $this = $(this);
        },

        // Removes (some) HTML characters to prevent HTML injection.
        sanitize : function(text) {
            return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        },
        
        // Formats the message for display.
        // Replaces newlines with the <br /> element
        // replaces tabs with 2-spaces
        // replaces leading spaces with non-breaking spaces
        // replaces url's with active links (open a new window)
        format : function(text) {
            return text.replace(/^\t*/, "&nbsp;&nbsp;")
            .replace(/\r\n/g, "<br/>")
            .replace(/\n/g, "<br/>")
            .replace(/\s/g, "&nbsp;")
            .replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>')
            .replace(/(\b(spotify:track):[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>');
        },

        replaceSpotifyURIs : function(text) {
            spotify_uris = text.match(/(\b(spotify:track):[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)
            for( spotify_uri in spotify_uris ) {
                
            }
            return spotify_links.length > 0? true: false;
        },

        formatSpotifyURIlink : function(text, track) {
            text.replace(link, '<a href="' + track.uri + '" target="_blank">' + track.name + '</a>')
        },

        // Scrolls the window to the bottom of the chat dialogue.
        scrollToEnd : function() {
            $(document).scrollTop($(document).height() + 500);
        },

        // A primitve UI state controller. Call with true to show the "logged in" UI;
        // call with false to show the "logged out" UI.
        setChatDisplay : function (settings, enabled) {
            //console.log(settings);
            settings.$loginElements.toggle(!enabled);
            settings.$chatElements.toggle(enabled);
        },

        // Performs an ajax call to log the user in.  Sends an empty POST request
        // with the username in the request URL.
        login : function(settings) {
            var desiredUsername = settings.chatUsername; // $.trim($usernameField.val());
            var url = settings.chatServerURL + "/login/" + settings.channelID + "/" + desiredUsername;
            var data = "channel=" + settings.chatChannel + "&message=" + settings.loginMessage;
            //console.log(url);
            $.ajax({
              type: 'POST',
              url: url,
              async: true,
              cache: false,
              timeout: 5000,
              data: data,
              success: function(data){
                settings.username = desiredUsername;
                settings.loggedIn = true;
                settings.$usernameDisplay.text(settings.username);
                methods.setChatDisplay(settings, true);
                settings.$loginErrors.toggle(false);
                settings.$composeMessageField.focus();
                $.cookie("spotichatid", settings.username,{ expires: 7, path: '/', domain: 'spotichat', secure: true });
                settings.$channelName.html(settings.chatChannel);
                methods.poll(settings);
              },
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                methods.handleError(settings, settings.$loginErrors, textStatus, errorThrown);
              }
            });
        },

        // Performs an ajax call to log the user out.  Sends an empty DELETE request
        // with the username in the request URL.
        logout : function(settings) {
            var data = "channel=" + settings.chatChannel + "&message=" + settings.loginMessage;

            $.ajax({
              type: 'DELETE',
              url: settings.chatServerURL + "/login/" + settings.channelID + "/" + settings.username,
              async: true,
              cache: false,
              timeout: 30000,
              data: data,
              success: function(data){
                // do nothing, we logout in complete
              },
              error: function(XMLHttpRequest, textStatus, errorThrown) {       
                // do nothing, we logout in complete even if we fail
                methods.handleErrors(settings, settings.$loginErrors, textStatus, errorThrown);
              },
              complete: function() {
                methods.logoutClient(settings);
              }
            });
        },

        // Performs an ajax call to log the user out.  Sends an empty DELETE request
        // with the username in the request URL.
        switchChannel : function(settings, newChannel) {
            var currentChannel = settings.chatChannel;
            settings.chatChannel = newChannel;
            //console.log("switching channels from " + currentChannel + " to " + newChannel);
            $.ajax({
              type: 'DELETE',
              url: settings.chatServerURL + "/login/" + settings.username,
              async: true,
              cache: false,
              timeout: 30000,
              data: "channel=" + currentChannel,
              success: function(data){
                // do nothing, we logout in complete
              },
              error: function(XMLHttpRequest, textStatus, errorThrown) {       
                // do nothing, we logout in complete even if we fail
                methods.handleErrors(settings, settings.$loginErrors, textStatus, errorThrown);
              },
              complete: function() {
                methods.login(settings);
              }
            });
        },

        // performs all the local actions needed to log a user out
        // this will get called without logout ajax call when a session is expired
        logoutClient : function(settings) {
            methods.setChatDisplay(settings, false);    
            settings.username = '';
            settings.loggedIn = false;
            settings.$usernameField.val('');
            settings.$usernameField.focus();
        },

        // Given a list of messages, appends them to the $messageContainer element,
        // according to the Mustache template defined as messageTemplate.
        displayMessages : function(settings, messages) {
            $(messages).each(function(){
              //console.log(this.message);
              // make sure we are a relevant message
              // we don't want to get caught in the middle of context switchinng
              //if(this.channel == settings.channel) {
                  this.message = methods.format(methods.sanitize(this.message));
                  //console.log(this);
                  settings.$messageContainer.append(methods.renderMessage(settings, this));
                  if(this.timestamp && this.timestamp > settings.lastMessageTimestamp) {
                    settings.lastMessageTimestamp = this.timestamp;
                  }
              //}
            });
            methods.scrollToEnd();
        },

        // Renders a message object using the Mustache template stored in the
        // variable channeTemplate.  Formats the timestamp accordingly. */
        renderMessage : function(settings, message) {
            var date = new Date();
            date.setTime(message.timestamp);
            message.formattedTime = date.toString().split(' ')[4];
            return Mustache.to_html(settings.messageTemplate, message);
        },

        // Renders a channel object using the Mustache template stored in the
        // variable channelTemplate.  Formats the timestamp accordingly. */
        renderChannel : function(config) {
            return Mustache.to_html(config.channelTemplate, config);
        },

        // Given an input element and a button element, disables the button if the
        // input field is empty.
        setButtonBehavior : function($inputField, $submitButton){
            var value = $.trim($inputField.val());
            if(value){
              $submitButton.removeAttr("disabled");
            } else {
              $submitButton.attr("disabled", "disabled");
            }
        },

        // processes a send message request.  The message is sent as a POST request,
        // with the message text defined in the POST body.
        sendMessageClick : function(settings, event) {
            var $this = $(this);    
            var message = $.trim(settings.$composeMessageField.val());
            $this.attr("disabled", "disabled");
            settings.$composeMessageField.blur();
            settings.$composeMessageField.attr("disabled", "disabled");

            data = 'nickname=' + settings.username + "&channel=" + settings.chatChannel + '&message=' + message;

            $.post(settings.chatServerURL + '/feed', data)
              .success( function(){
                settings.$composeMessageField.val("");
                settings.$chatErrors.toggle(false);
              })
              .error( function(XMLHttpRequest, textStatus, errorThrown) {
                methods.handleError(settings, settings.$chatErrors, textStatus, errorThrown);
              })
              .complete( function(){
                settings.$composeMessageField.removeAttr("disabled");
                settings.$composeMessageField.focus();
                $this.removeAttr("disabled");
              });

            event.preventDefault();
            event.stopPropagation();
            return false;
        },

        // sends a GET request for new messages.  This function will recurse indefinitely.
        poll : function(settings) {
            if (!settings.loggedIn) {
              return false;
            }
            $.ajax({
              type: "GET",
              url: settings.chatServerURL + "/feed/" + settings.chatChannel,
              async: true,
              cache: false,
              timeout: 1200000,
              data: 'since_timestamp=' + settings.lastMessageTimestamp + '&nickname=' + settings.username,
              success: function(data) {
                methods.displayMessages(settings, data.messages);
              },
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                methods.handleError(settings, settings.$chatErrors, textStatus, errorThrown);
              },
              complete: function() {
                methods.poll(settings);
              }
            });
        },

        // display our chat errors
        // if the session has timed out, boot them
        // if there is a network error, assume the server is down, boot them
        handleError : function(settings, $errorElement, textStatus, errorThrown) {
            //console.log(settings);
            if(errorThrown === 'Authentication failed') {
              methods.logoutClient(settings);
              settings.$loginErrors.text('Authentication failed! Perhaps your session expired.');
              settings.$loginErrors.toggle(true);
            } else if (errorThrown === 'Not found' || errorThrown === 'timeout') {
              methods.logoutClient(settings);
              settings.$loginErrors.text('Chat server can not be found. Perhaps it is down, or you have no network connection.');
              settings.$loginErrors.toggle(true);
            } else {
              if (errorThrown ==='')
                errorThrown = 'Unable to contact server';
              $errorElement.text(errorThrown);
              $errorElement.toggle(true);
            }
        },

        switchChatChannel : function(channelName) {
            var settings = $(this).data('settings'); 
            settings.chatChannel = channelName;
            settings.$messageContainer.html('');            
        },

        setLoginMessage : function(loginMessage) {
            var settings = $(this).data('settings'); 
            settings.loginMessage = loginMessage;
        },

        setLogoutMessage : function(logoutMessage) {
            var settings = $(this).data('settings'); 
            settings.logoutMessage = logoutMessage;
        },

        getLoggedIn : function() {
            var settings = $(this).data('settings'); 
            if(settings == null) 
                return false;
            return settings.loggedIn;
        },

        // Our main setup function.  This function performs no dom manipulation directly,
        // so the layout of your page is preserved after it is called. Accepts a
        // config object as its only argument, which is used to specify jQuery
        // selectors of to bind event listeners to, as well as a Mustache template to
        // dictate how a message should be formatted.
        buildChatWindow : function(settings, config, $channelContainer) {

            // create our channel from z-mustache
            var $channel = $(methods.renderChannel(config));
            // stick it in the DOM
            $channelContainer.html($channel);

            settings.$chatElements = $channel.find(config.chatElements);
            settings.$chatContainer = $channel.find(config.chatContainer);
            settings.$messageContainer = $channel.find( "." + config.messageContainer);
            settings.$loginButton = $channel.find( "." + config.loginButton);
            settings.$logoutButton = $channel.find("." + config.logoutButton);
            settings.$channelHeader = $channel.find(config.channelHeader);
            settings.$channelName = $channel.find("." + config.channelName);
            settings.$loginElements = $channel.find(config.loginElements);
            settings.$loginContainer = $channel.find(config.loginContainer);
            settings.$loginErrors = $channel.find( "." + config.loginErrors);
            settings.$sendMessageButton = $channel.find( "." + config.sendMessageButton);
            settings.$composeMessageField = $channel.find( "." + config.composeMessageField);
            settings.$usernameField = $channel.find( "." + config.usernameField);
            settings.$usernameDisplay = $channel.find( "." + config.usernameDisplay);
            settings.$chatErrors = $channel.find( "." + config.chatErrors);
            settings.messageTemplate = config.messageTemplate;
            settings.channelTemplate = config.channelTemplate;
            settings.chatServerURL = config.chatServerURL;
            settings.channelID = config.channelID;
            settings.chatChannel = config.chatChannel;
            settings.chatUsername = config.chatUsername;
            settings.loginMessage = config.loginMessage;
            settings.logoutMessage = config.logoutMessage;

            settings.$loginButton.data('channelContainer',$channelContainer);
            settings.$loginButton.click(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              methods.login(settings);
              event.preventDefault();
            });

            settings.$logoutButton.data('channelContainer',$channelContainer);
            settings.$logoutButton.click(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              methods.logout(settings);
              event.preventDefault();
            });

            settings.$composeMessageField.data('channelContainer',$channelContainer);
            settings.$composeMessageField.keyup(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              methods.setButtonBehavior($(this), settings.$sendMessageButton);
            });

            settings.$composeMessageField.data('channelContainer',$channelContainer);
            settings.$composeMessageField.keydown(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              if(event.keyCode == 13 && !event.shiftKey){
                if($.trim(settings.$composeMessageField.val())){
                  settings.$sendMessageButton.click();
                } else {
                  return false;
                }
              }
            });

            settings.$usernameField.data('channelContainer',$channelContainer);
            settings.$usernameField.keydown(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              if(event.keyCode == 13 ){
                if($.trim($usernameField.val())){
                  $loginButton.click();
                }
              }
            });

            $(window).unload(function(event){
              logout();
            });

            settings.$usernameField.keyup(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              setButtonBehavior($(this), $loginButton);
            });

            settings.$sendMessageButton.data('channelContainer',$channelContainer);
            settings.$sendMessageButton.click(function(event) {
              var settings = $(this).data('channelContainer').data('settings'); 
              if($.trim(settings.$composeMessageField.val()))
                methods.sendMessageClick(settings, event);
            });
            
            if(settings.chatUsername!=null && settings.chatUsername!='' && settings.loggedIn) {
                methods.login(settings);
            }
            
            return settings;
        }
    };

    /******************************************************
    ** Where it all starts, calls the correct method
    ******************************************************/
    $.fn.chatify = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method == 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' + method + ' does not exist on jQuery.chatify' );
        }
    };
})( jQuery );

$(document).ready(function() {
  $("#nickname").focus();
});