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
	
	//Control the changing of the slide
  function changeSlide (event) {
		event.stopPropagation();
		var $preso = $(this),
		data = $preso.data().preso,
		$slides = data.slides,
		currentSlide = parseInt(data.currentSlide) || 0,
		nextSlide = event.newSlide || parseInt(window.location.hash.substr(1)) || 0,
		$currentSlide,
		$nextSlide;
		// Go forward/back from the current slide.
		if (typeof(nextSlide) === 'string') {
			switch (nextSlide) {
			case 'forward' :
				nextSlide = ((currentSlide + 1) <= ($slides.length - 1)) ? (currentSlide + 1) : 0;
				break;
			case 'backward' :
				nextSlide = ((currentSlide - 1) >= 0) ? (currentSlide - 1) : ($slides.length - 1);
				break;
			default:
				break;
			}
		}
		// Find the slides to change.
		$currentSlide = $slides.filter(':eq(' + currentSlide + ')');
		$nextSlide = $slides.filter(':eq(' + nextSlide + ')');
		// Transition the slides according to the options.
		switch (event.data.options.transition) {
		case 'show/hide':
			$currentSlide.hide();
			$nextSlide.show();
			break;
		case 'slide':
			$currentSlide.slideUp(500, function () {
			$nextSlide.slideDown(1000)
			});
			break;
		default:
			$currentSlide.fadeOut(500);
			$nextSlide.fadeIn(500)
		}
		        
    // $root.find('.'+$root.options.pagerClass).children('.current').removeClass('current');
    // $root.find('.'+$root.options.pagerClass).children(':nth-child('+newSlide+')').addClass('current');
    // Update the presentation data.
		data.currentSlide = nextSlide;
  }
  
  //Handle clicking of a specific slide
	function pageClick ($pager) {
    if(!$pager.parent().hasClass('current')) {
      $root.changeSlide($pager.parent().prevAll().length + 1);
      $root.count = $pager.parent().prevAll().length + 1;
    }
  }
  
  // Add presentation controls
  function addControls (event) {
	  $root.numSlides = $root.slides.length;
	  
	  //Add in the pager
	  var navPager = '<ol class="'+$root.options.pagerClass+'">';
	  for(var i = 1; i < $root.numSlides+1; i++) {
	    navPager += '<li><a href="#'+i+'">'+i+'</a></li>';
	  }
	  $root.append(navPager);
	  
	  if($root.currentHash) {
	    $root.find('.'+$root.options.pagerClass).children(':nth-child('+$root.currentHash+')').addClass('current');
	    $root.count = $root.currentHash;
	  } else {
	    $root.find('.'+$root.options.pagerClass).children(':first-child').addClass('current');
	    $root.count = 1;
	  }
	
	  //Add in the previous/next links
	  $root.append('<ul class="'+$root.options.prevNextClass+'"><li><a href="#prev" class="prev">'+$root.options.prevText+'</a></li><li><a href="#next" class="next">'+$root.options.nextText+'</a></li>');
	  
	  //When a specific page is clicked, go to that page
	  $root.find('.'+$root.options.pagerClass).find('a').bind('click', function() {
	    $root.pageClick($(this));
	  });
	  
	  //When you click a previous/next link
	  $root.find('.'+$root.options.prevNextClass).find('a').click(function() {
	    $root.prevNextClick($(this).attr('class'));
	    return false;
	  });
	  
	  //When you hit the left arrow, go to previous slide
	  //When you hit the right arrow, go to next slide
	  $(document).keyup(function(e) {
	    var action = '';
	    if(e.keyCode === 37) {
	      action = 'prev';
	    } else if(e.keyCode === 39) {
	      action = 'next';
	    }
	    
	    if(action !== '') {
	      $root.prevNextClick(action);
	    }
	  });
	}
	
	// If the slide references an external page, load the page into the slide.
  function loadSlideContent ($slides) {
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
  
  // Pull the outline apart and create a flat presentation
  // element using divs.
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
				var o = $.meta ? $.extend({}, opts, $outline.data()) : opts;

				var $parent = $(this).parent();
				var $outline = $(this).detach();
				
				// Make and attach the presentation to the DOM based on the outline.
				// The outline elements will be detached from the DOM.
				var $preso = $.proxy(createPresentation, $parent)(parseOutline($outline));
				var $slides = $preso.children();
				// Add the outline to the preso's data
				$preso.data().preso = {
					outline: $outline,
					slides: $slides,
					// currentSlide is a 0-based index
					currentSlide: 0
				};
				
				// Hide all of the slides initially
				$slides.hide();
				
				// Event bindings
				$preso.on({
					'slide': changeSlide,
					'ready': addControls
				}, '', {
					options: o
				});
				
				// Set up the first slide
				$preso.trigger('slide');
				// $preso.trigger('ready');
				// Load external slides.
				// this.loadSlideContent($root.slides);
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
		slide: '.slide',
		pagerClass: 'nav-pager',
		prevNextClass: 'nav-prev-next',
		prevText: 'Previous',
		nextText: 'Next',
		transition: "fade"
	};
}
(jQuery));