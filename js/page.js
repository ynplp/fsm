/* 
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Finite State Machine Designer
Author : Sean Xiao
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/

/**
 * Close main menu
 * @param {none}
 * @return {none}
 */
function closeMenu() {
	var menu = $('#menu-container');
	var width = menu.innerWidth() + 5;
	if (menu.offset().left >= 0) {
		localStorage.menuHidden = 'true';
		menu.animate({ left: '-=' + width + 'px' }, 200);
	}
}
/**
 * Toggle main menu
 * @param {none}
 * @return {none}
 */
function toggleMenu() {
	var menu = $('#menu-container');
	if (menu.offset().left < 0) {
		localStorage.menuHidden = 'false';
		menu.animate({ left: '0px' }, 200);
	}
	else {
		closeMenu();
	}
}

/**
 * Toggle night mode
 * @param {none}
 * @return {none}
 */
function toggleNightMode() {
	var nightcss = $('link[href=\'css/fsm-night.css\']');
	if (nightcss.length === 0) {
		$('<link />').attr('rel', 'stylesheet')
			.attr('type', 'text/css')
			.attr('href', 'css/fsm-night.css')
			.appendTo('head');

		// Firefox doesn't support particular special character
		if (navigator.userAgent.toLowerCase().indexOf('firefox') >= 0) {
			$('#night h1').html('&#9680');
		}
		else {
			$('#night h1').html('&#9790');
		}

		localStorage.night = 'true';
	}
	else {
		nightcss.remove();
		$('#night h1').html('&#9728');

		localStorage.night = 'false';
	}
}

/**
 * Create popup message
 * @param {String} message to be displayed
 * @param {Integer} duration of message
 * @return {none}
 */
function sendAlert(message, duration) {
	$('.alert-content h2').html(message);
	$('.alert').css('opacity', 0).css('display', 'flex');
	$('.alert').animate({ opacity: 1 }, 200, function () {
		$('.alert').animate({ opacity: 1 }, duration, function () {
			$('.alert').animate({ opacity: 0 }, 200, function () {
				$('.alert').css('display', 'none');
			});
		});
	});
}

/**
 * Refresh the page after calling callback function
 * @param {function} callback function
 * @param {Object} arguments for callback function
 * @return {none}
 */
function refreshPage(callback, args) {
	if (callback != null)
		callback(args);
	location.reload();
}

window.onload = function () {
	// Check localStorage values
	if (localStorage.menuHidden == null) {
		localStorage.menuHidden = 'true';
	}
	if (localStorage.night == null) {
		localStorage.night = 'false';
	}
	else if (localStorage.night == 'true') {
		toggleNightMode();
	}

	// Hide the menus
	if (localStorage.menuHidden === 'true')
		$('#menu-container').offset({ left: -1 * ($('#menu').innerWidth() + 5) });
	$('#menu-container').mouseleave(function() { closeMenu(); });

	// Toggle menus when clicked
	$('#settings').click(function () { toggleMenu(); });

	// Toggle night mode when clicked
	$('#night').click(function() { toggleNightMode(); });
}

function addLoadEvent(func) {
	var prevOnload = window.onload;

	if (typeof window.onload != 'function') {
		window.onload = func;
  }
  else {
  	window.onload = function() {
  		if (prevOnload != null)
  			prevOnload();
      
      func();
    }
  }
}
