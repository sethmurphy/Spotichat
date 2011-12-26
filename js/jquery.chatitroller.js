/*********************************************************
 *	This plugin manages a caped list of chatify clients
 *********************************************************/
(function( $ ){

    var methods = {
        init : function( config ) {
            // need to encapsulate these in each item
            // we have no sensible default for most, they need to be defined
            var settings = {
                channelCountMax:                1,         // the maximumn number of open channels
                chatifyClass:    'chatify-channel'         // the classname of a chatify channel container
            };
            
            if ( config ) {
                $.extend( settings, config );
            }

            return this.each(function() {
                var $this = $(this), data = $this.data("settings");
    
                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    settings.count = $this.children().length;                    
                    $this.data("settings",settings);
                }
            });
            return this;
        },

        /******************************************************
        ** Destroy us, everything
        ******************************************************/
        destroy : function () {
            var $this = $(this);
        },

        // adds a new channel
        addChannel : function( channelConfig ) {
            return this.each(function() {
                console.log("addChannel");
                var $this = $(this), settings = $this.data("settings");
                console.log($this);
                $existing = $this.find("#" + channelConfig.channelID);
                console.log($existing);
                if($existing == null || $existing.length == 0) {
                    var children = $this.children();
                    console.log(children);
                    if( children.length < settings.channelCountMax) {
                        // just add a new channel
                        console.log("adding new channel");
                        var html = '<div class="' + settings.chatifyClass + '"></div>';
                        console.log(html);
                        var $chatifyContainer = $(html);
                        console.log($chatifyContainer);
                        console.log(channelConfig);
                        console.log(methods.logoutChannelHandler);
                        channelConfig.logoutCallback = methods.logoutChannelHandler,
                        
                        $chatifyContainer.chatify(channelConfig);
                        
                        console.log("created");
                        $this.prepend($chatifyContainer);
                        console.log("added");
                    } else {
                        // reuse the oldest channel
                        console.log("updating channels");
                        // get our oldest channel
                        var $recycle_element = $(children[children.length -1]);
                        var $recycle_channel = $($recycle_element.children()[0]);

                        console.log($recycle_channel);
                        console.log($recycle_element);
                        
                        $recycle_element.detach();
                        console.log(1);
                        $this.prepend($recycle_element);
                        console.log($recycle_element.data("settings"));
                        console.log(2);
                        $recycle_channel.attr('id', channelConfig.channelID)
                        $recycle_channel.chatify("switchChannel", $recycle_element.data("settings"), channelConfig);                    
                        console.log("updated channels");
                    }
                }else {
                    // just move us to the beginning
                    $existing = $existing.parent();
                    $existing.detach();
                    $this.prepend($existing);    
                }

           });
        },

        // removes a channel from display
        removeChannel : function( channel_id ) {
            console.log("removeChannel");
            var $this = $(this);
            console.log($this);
            console.log(channel_id);
            var $channel = $this.find("#" + channel_id);
            console.log($channel);
            if( $channel != null && $channel.length > 0)
                $channel.parent().remove();

        },

        // handles the callback from a channel on logout
        logoutChannelHandler : function(channel_settings) {

            console.log("logoutChannelHandler");
            $this = $(this);
            var settings = $this.data('settings'); 
            console.log("channel_settings");
            console.log(channel_settings);
            console.log("settings");
            console.log(settings);

            console.log($this);
            
            if($this.children().length > 1) {
                methods.removeChannel.call( $this, channel_settings.channelID)
            }
        },

        getLoggedIn : function() {
            var $this  = $(this);
            var children = $this.children();
            for(var i = 0; i < children.length; i++) {
                if($(children[i]).chatify("getLoggedIn")) {
                   return true;
                }
            }
            return false;
        }
    };

    /******************************************************
    ** Where it all starts, calls the correct method
    ******************************************************/
    $.fn.chatitroller = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method == 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' + method + ' does not exist on jQuery.chatitroller' );
        }
    };
})( jQuery );