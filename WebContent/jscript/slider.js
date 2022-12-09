//---------------------------------+
//  CARPE  S l i d e r        1.5  |
//  2006 - 01 - 03                 |
//  By Tom Hermansson Snickars     |
//  Copyright CARPE Design         |
//  http://carpe.ambiprospect.com/ |
//  Contact for custom scripts     |
//  or implementation help.        |
//---------------------------------+
// Customized by Steven Pothoven
// - removed horizontal option
// - removed display of value


// Global vars. You don't need to make changes here to change your sliders.
// Changing the attributes in your (X)HTML file is enough.
var carpeDefaultSliderLength      = 100;
var carpeSliderClassName          = 'carpe_slider';

// carpeGetElementsByClass: Cross-browser function that returns
// an array with all elements that have a class attribute that
// contains className
function carpeGetElementsByClass(className)
{
	var classElements = new Array();
	var els = document.getElementsByTagName("*");
	var elsLen = els.length;
	var pattern = new RegExp("\\b" + className + "\\b");
	for (i = 0, j = 0; i < elsLen; i++) {
		if ( pattern.test(els[i].className) ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}
// carpeTop: Cross-browser version of "element.style.top"
// Returns or sets the vertical position of an element.
function carpeTop(elmnt, pos)
{
	if (!(elmnt = document.getElementById(elmnt))) {
		return 0;
	}
	if (elmnt.style && (typeof(elmnt.style.top) == 'string')) {
		if (typeof(pos) == 'number') {
			elmnt.style.top = pos + 'px';
		} else {
			pos = parseInt(elmnt.style.top, 10);
			if (isNaN(pos)) {
				pos = 0;
			}
		}
	}
	else if (elmnt.style && elmnt.style.pixelTop) {
		if (typeof(pos) == 'number') {
			elmnt.style.pixelTop = pos;
		} else {
			pos = elmnt.style.pixelTop;
		}
	}
	return pos;
}
// moveSlider: Handles slider while dragging
function moveSlider(evnt)
{
	evnt = (!evnt) ? window.event : evnt; // The mousemove event
	// Only if slider is dragged
	if (mouseover) { 
		// Vertical mouse position relative to allowed slider positions
		y = slider.startOffsetY + evnt.screenY;
		// Limit vertical movement
		if (y > slider.distance) {
			y = slider.distance;
		}
		else if (y < 0){
			y = 0;
		}
		// move slider to new vertical position
		carpeTop(slider.id, y) ;
 		// pixel value of slider regardless of orientation
 		sliderVal = y;
		sliderPos = (slider.distance / slider.valuecount) * 
			Math.round(slider.valuecount * sliderVal / slider.distance);
		// calculate new value
		v = Math.round((sliderPos * slider.scale + slider.from) * 
			Math.pow(10, slider.decimals)) / Math.pow(10, slider.decimals);
		// set the new value in the slider element
		slider.value = v ;
		// zoom chart accordingly
		window.zoom('to', v / 10);
		
		return false;
	}
	return;
}

// slide: Handles the start of a slider move.
function slide(evnt)
{
	// Get the mouse event causing the slider activation.
	if (!evnt) {
		evnt = window.event; 
	}
	// Get the activated slider element.
	slider = (evnt.target) ? evnt.target : evnt.srcElement; 
	// The allowed slider movement in pixels.
	dist = parseInt(slider.getAttribute('distance'), 10);
	// Default distance from global var.
	slider.distance = dist ? dist : carpeDefaultSliderLength;
	 // Number of decimals allowed.
	dec = parseInt(slider.getAttribute('decimals'), 10);
	// Default number of decimals: 0.
	slider.decimals = dec ? dec : 0;
	// Allowed number of values in the interval.
	val = parseInt(slider.getAttribute('valuecount'), 10);
	// Default number of values: the sliding distance.
	slider.valuecount = val ? val : slider.distance + 1; 
	// Min/start value for the slider.
	from = parseFloat(slider.getAttribute('from'));
	// Default min/start value: 0.
	from = from ? from : 0;
	// Max value for the slider.
	to = parseFloat(slider.getAttribute('to'));
	// Default number of values: the sliding distance.
	to = to ? to : slider.distance;
	// Slider-display scale [value-change per pixel of movement].
	slider.scale = (to - from) / slider.distance;
	// Invert for vertical sliders. "Higher is more."
	slider.from = to;
	// Invert scale for vertical sliders. "Higher is more."
	slider.scale = -slider.scale;
	// Slider-mouse vertical offset at start of slide.
	slider.startOffsetY = carpeTop(slider.id) - evnt.screenY;
	mouseover = true;
	// Start the action if the mouse is dragged.
	document.onmousemove = moveSlider; 
	// Stop sliding.
	document.onmouseup = sliderMouseUp;
	return false;
}

// sliderMouseUp: Handles the mouseup event after moving a slider.
// Snaps the slider position to allowed/displayed value. 
function sliderMouseUp()
{
	if (mouseover) {
		setSliderPosition(slider);

		if (document.removeEventListener) { 
			// Remove event listeners from 'document' (W3C).
			document.removeEventListener('mousemove', moveSlider, false);
			document.removeEventListener('mouseup', sliderMouseUp, false);
		} else if (document.detachEvent) { 
			// Remove event listeners from 'document' (IE).
			document.detachEvent('onmousemove', moveSlider);
			document.detachEvent('onmouseup', sliderMouseUp);
		}
	}
	// Stop the sliding.
	mouseover = false;
}

// setSliderPosition
// Snaps the slider position to set value. 
function setSliderPosition(slider) {
		// Find last slider value.
		v = (slider.value) ? slider.value : 0;
		// Calculate slider position
		slider.scale = -((slider.to - slider.from) / slider.distance);
		pos = (v - slider.from)/(slider.scale);
		pos = (pos > slider.distance) ? slider.distance : pos;
		pos = (pos < 0) ? 0 : pos;
		// Snap vertical slider to corresponding display position.
		carpeTop(slider.id, pos);
}

/*
window.onload = function() // Set up the sliders and the displays.
{
	sliders = carpeGetElementsByClass(carpeSliderClassName) // Find the horizontal sliders.
	for (i = 0; i < sliders.length; i++) {
		sliders[i].onmousedown = slide // Attach event listener.
	}
}
*/