/*! Plugin options and other jQuery stuff */

// Responsive Nav
var navigation = responsiveNav("#site-nav", { // Selector: The ID of the wrapper
  animate: true, // Boolean: Use CSS3 transitions, true or false
  transition: 400, // Integer: Speed of the transition, in milliseconds
  label: "<i class='icon-reorder'></i> Menu", // String: Label for the navigation toggle
  insert: "before", // String: Insert the toggle before or after the navigation
  customToggle: "", // Selector: Specify the ID of a custom toggle
  openPos: "relative", // String: Position of the opened nav, relative or static
  jsClass: "js", // String: 'JS enabled' class which is added to <html> el
  init: function(){}, // Function: Init callback
  open: function(){}, // Function: Open callback
  close: function(){} // Function: Close callback
});

$('html').click(function() {
  //Hide the menus if visible
  navigation.toggle();
});

$('#site-nav').click(function(event){
    event.stopPropagation();
});

// FitVids options
$(function() {
	$("article").fitVids();
});

// Behaviour on Breakpoints
// conditionally load TOC, on mq @large
enquire.register("only screen and (min-width: 62.5em)", {

    // OPTIONAL
    // If supplied, triggered when a media query matches.
    match : function() {
      $('#toc').removeClass('hide');
    },

    // OPTIONAL
    // If supplied, triggered when the media query transitions
    // *from a matched state to an unmatched state*.
    unmatch : function() {
      $('#toc').addClass('hide');
    },

    // OPTIONAL
    // If supplied, triggered once, when the handler is registered.
    setup : function() {
      $('#toc').toc();
      $("#toc").stick_in_parent({
        parent: 'body',
        offset_top: 30
      });
    },

    // OPTIONAL, defaults to false
    // If set to true, defers execution of the setup function
    // until the first time the media query is matched
    deferSetup : true,

    // OPTIONAL
    // If supplied, triggered when handler is unregistered.
    // Place cleanup code here
    destroy : function() {}
});
