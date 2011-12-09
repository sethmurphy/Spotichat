/*********************************************************
 *	This plugin manages a caped list of chatify clients
 *********************************************************/
(function( $ ){

    var methods = {
        init : function( config ) {
            // need to encapsulate these in each item
            // we have no sensible default for most, they need to be defined
            var settings = {
                channelCount:                   0,         // the number of current channels beng managed
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
                var $this = $(this), settings = $this.data("settings");
                if( $this.children().length <= settings.channelCountMax) {
                    // just add a new channel
                    console.log("adding new channel");
                    var html = '<div class="' + settings.chatifyClass + '"></div>';
                    console.log(html);
                    var $chatifyContainer = $(html);
                    console.log($chatifyContainer);
                    console.log(channelConfig);
                    $chatifyContainer.chatify(channelConfig);
                    console.log("created");
                    $this.append($chatifyContainer);
                    console.log("added");
                } else {
                    // reuse the oldest channel
                    console.log("updating channels");
                }
           });
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