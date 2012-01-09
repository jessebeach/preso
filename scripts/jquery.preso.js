/*
 * Slideshow Outline
 * http://www.qemist.us/
 *
 * Copyright (c) 2011 Jesse Beach
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://jquery.org/license
 *
 * @version 0.1
 *
 * Example usage:
 * $('#slides').presentation({
 *   slide: '.slide',
 *   pagerClass: 'nav-pager',
 *   prevNextClass: 'nav-prev-next',
 *   prevText: 'Previous',
 *   nextText: 'Next',
 *   transition: 'fade'
 * });
 */
(function($) {
  // Private variables
  var html = $('html').get(0);
  var textDirection = (html.dir) ? html.dir : 'ltr';
	
	// Private functions.
	/**
	 * Get a flattened list of items in the outline. We want
	 * them in the same order as they're read top to bottom.
	 */
	function parseOutline ($outline) {
		var $items = $();
		$outline.children('li').each(function(index) {
			var $this = $(this),
			$children = $this.children('ol').detach();
			$items = $items.add($this.detach());
			$children.each(function (index) {
				var $this = $(this);
				$items = $items.add(parseOutline($this));
			});
		});
		return $items;
	}
  
	// Create a presentation from the $items passed in.
	function createPresentation ($items) {
		var $root = this;
		var $preso = $('<div>', {}).addClass('preso-root');
		$items.each(function (index) {
			var $this = $(this);
			$preso.append($('<div>', {
				html: $this.html().trim()
			}));
		});
		$root.append($preso);
		return $preso;
	}
	
	// If the slide references an external page, load the page into the slide.
	function loadExternalContent ($slides) {
		$slides.each(function (index) {
			// If the slide has a data-href element, load the value of the
			// attribute into the slide.
			var $this = $(this),
			href = $this.data().href;
			
			if (href !== undefined) {
				$this.load(href + ' .slide-content');
			}
			
		});
	}
	
	//Control the changing of the slide
	function changeSlide (event) {
		event.stopPropagation();
		var $preso = $(this),
		data = $preso.data().preso,
		options = data.options,
		$slides = data.slides,
		hash = (window.location.hash) ? parseInt(window.location.hash.substr(1)) : 1,
		currentSlide = (data.currentSlide > 0) ? data.currentSlide : hash,
		nextSlide = (event.data && (event.data.newSlide !== 'undefined')) ? event.data.newSlide : currentSlide,
		$currentSlide,
		$nextSlide,
		len = $slides.length;
		// Stop any animations that are running.
		$slides.stop(true, true);
		// Go forward/back from the current slide.
		if (typeof(nextSlide) === 'string') {
			switch (nextSlide) {
			case 'next' :
				nextSlide = ((currentSlide + 1) <= (len)) ? (currentSlide + 1) : 1;
				break;
			case 'previous' :
				nextSlide = ((currentSlide - 1) > 0) ? (currentSlide - 1) : len;
				break;
			default:
				break;
			}
		}
		// Find the slides to change.
		$nextSlide = $slides.filter(':eq(' + (nextSlide - 1) + ')');
		// Transition the slides according to the options.
		switch (options.transition) {
		case 'show/hide':
			$slides.not($nextSlide).hide();
			$nextSlide.show();
			break;
		case 'slide':
			$slides.not($nextSlide).slideUp(500, function () {
				$nextSlide.slideDown(1000);
			});
			break;
		default:
			$slides.not($nextSlide).fadeOut(500);
			$nextSlide.fadeIn(500)
		}

		// Update the pager.
		data.pager
		.children()
		.filter(':eq(' + (currentSlide - 1) + ')')
		.removeClass('current')
		.end()
		.filter(':eq(' + (nextSlide - 1) + ')')
		.addClass('current');
		// Update the presentation data.
		data.currentSlide = nextSlide;
  }
  
  // Add presentation controls
  function addControls (event) {
		event.stopPropagation();
		var $preso = $(this),
		data = $preso.data().preso,
		options = data.options,
		$wrapper = data.wrapper,
		$slides = data.slides,
		len = $slides.length;
		
		// The changeSlide event has to be done in the context of the preso.
		var changeSlideTrigger = $.proxy(changeSlide, $preso);
	  
	  //Add the pager.
	  var $pager = $('<ol>').addClass(options.pagerClass);
	  for(var i = 0; i < len; i++) {
	    $pager.append($('<li>', {
	    	html: $('<a>', {
		    	href: '#' + (i + 1),
		    	text: (i + 1)
		    })
		    .on({
			  	'click': changeSlideTrigger
			  }, '', {newSlide: (i + 1)})
	    })
	    );
	  }
	  $pager.appendTo($wrapper);
	  // Add the pager to the preso data.
	  data.pager = $pager;
	
	  //Add in the previous/next links
	  var $nav = $('<ul>').addClass(options.prevNextClass);
	  $nav
	  .append($('<li>', {
		  	html: $('<a>', {
			  	text: options.prevText
			  })
			  .on({
			  	'click': changeSlideTrigger
			  }, '', {newSlide: 'previous'})
		  })
		  .addClass('prev')
	  )
	  .append($('<li>', {
		  	html: $('<a>', {
			  	text: options.nextText
			  })
			  .on({
			  	'click': changeSlideTrigger
			  }, '', {newSlide: 'next'})
		  })
		  .addClass('next')
	  )
	  .appendTo($wrapper);
	  // Add the nav to the preso data.
	  data.nav = $nav;
	  
	  //When you hit the left arrow, go to previous slide
	  //When you hit the right arrow, go to next slide
	  $(document).keyup(function(event) {
			event.data = event.data || {};
			// Left arrow key.
			if (event.keyCode === 37) {
				event.data.newSlide = 'previous';
				changeSlideTrigger(event);
			}
			// Up arrow key.
			else if (event.keyCode === 38) {
				event.data.newSlide = 1;
				changeSlideTrigger(event);
			}
			// Right arrow key.
			else if (event.keyCode === 39) {
				event.data.newSlide = 'next';
				changeSlideTrigger(event);
			}
			// Down arrow key.
			else if (event.keyCode === 40) {
				event.data.newSlide = len;
				changeSlideTrigger(event);
			}
	  });
	}
	
	/**
   * Public methods of the Preso plugin.
   */
  var methods = {
    init : function (options) {
      // Add the dir attribute to the HTML element if it does not exist.
      // This is part of RTL language support.
      if ($('html').attr('dir') === undefined) {
        $('html').attr('dir', textDirection);
      }
      // Build main options before element iteration.
      var opts = $.extend({}, $.fn.preso.defaults, options);
      // Iterate over matched elements.
      return this.each(function () {
				// Build element specific options. Uses the Metadata plugin if available
				// @see http://docs.jquery.com/Plugins/Metadata/metadata
				var o = $.meta ? $.extend({}, opts, $outline.data()) : opts,
				$this = $(this);
				// Wrap the presentation in a div so we have a stable context.
				$this.wrap($('<div>').addClass('preso-wrapper'));
				var $wrapper = $this.parent(),
				$outline = $this.detach();
				
				// Make and attach the presentation to the DOM based on the outline.
				// The outline elements will be detached from the DOM.
				var $preso = $.proxy(createPresentation, $wrapper)(parseOutline($outline));
				var $slides = $preso.children();
				// Add the outline to the preso's data
				$preso.data().preso = {
					wrapper: $wrapper,
					options: o,
					outline: $outline,
					slides: $slides
				};
				
				// Hide all of the slides initially
				$slides.hide();
				
				// Event bindings
				$preso.on({
					'load': loadExternalContent,
					'prep': addControls,
					'ready': changeSlide
				});
				// Load external slides.
				// $preso.trigger('load');
				// Set up the first slide.
				$preso.trigger('prep');
				// Add the controls.
				$preso.trigger('ready');
      });
    },
    destroy : function () {
      return this.each(function () {
        $(window).unbind('.preso');
      });
    }
  };
      
  // Add the plugin to the jQuery fn object.
  $.fn.preso = function (method) {
		// Method calling logic
		if (methods[method]) {
		  return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || ! method) {
		  return methods.init.apply(this, arguments);
		} else {
		  $.error('Method ' +  method + ' does not exist on jQuery.preso');
		}
  };

  // Preso plugin defaults.
  $.fn.preso.defaults = {
		pagerClass: 'nav-pager',
		prevNextClass: 'nav-prev-next',
		prevText: 'Previous',
		nextText: 'Next',
		transition: "fade"
	};
}
(jQuery));