/* svgEvents.js
 *
 * This file contains the JavaScript to add interactions to the SVG
 *
 * author: Steven Pothoven
 */

var svgEvents = {
	// Miscellaneous settings used by the SVG code
	panFactor : 50,
	svgHighlightColor : '#CCE5FF',
	svgOriginalItemColor : null,
	dragObj : {},
	centerX : 0,
	centerY : 0
};


// svgInitialize
// 
// This function is invoked by the SVG when it is done loading in order
// for the HTML page to gain access to the SVG object (svg.svgDocument)
// 			
svgEvents.initialize = function() { 
	if (svg.svgDocument.addEventListener) {
    	/** Add zoom in/on based on mouse wheel
    	 *  DOMMouseScroll is for mozilla. */
		svg.svgDocument.addEventListener('DOMMouseScroll', svgEvents.wheel, false);
		/** Add mouse drag to move chart */
		svg.svgDocument.addEventListener('mousedown', svgEvents.startDrag, false);
	} else {
		/** IE/Opera. */
		svg.svgDocument.onmousewheel = svgEvents.wheel;
		svg.svgDocument.onmousedown = svgEvents.startDrag;
	}

	// get center of viewbox in order to adjust for zooming
	centerX = svg.rootNode.getAttribute('width') / 2.0;
	centerY = svg.rootNode.getAttribute('height') / 2.0;
	
	if (typeof carpeGetElementsByClass == "function") {
		sliders = carpeGetElementsByClass(carpeSliderClassName);
		for (i = 0; i < sliders.length; i++) {
			sliders[i].onmousedown = slide; // Attach event listener.
		}
	}
};

// pan
//
// Pan (move) the SVG in the desired diection be the desired amount (in px)
// 
// direction is one of left,right,up,down
// amount is optional and will default to the panFactor
//
svgEvents.pan = function(direction, amount) { 
	var viewBox = svg.rootNode.getAttribute('viewBox');
	var viewVals = viewBox.split(' ');
	if (amount == null) {
		amount = svgEvents.panFactor;
	}
	switch (direction) {
		case 'left':
			amount = 0 - amount;
			// intentionally fall through
		case 'right':
			var currentPosition = parseFloat(viewVals[0]);
			currentPosition += amount;
			viewVals[0] = currentPosition;
			break;
		case 'up':
			amount = 0 - amount;
			// intentionally fall through
		case 'down':
			var currentPosition = parseFloat(viewVals[1]);
			currentPosition += amount;
			viewVals[1] = currentPosition;
			break;
		case 'origin':
			// reset everything to initial values
			viewVals[0] = 0;
			viewVals[1] = 0;
			svg.rootNode.currentScale = 1;
			svg.rootNode.currentTranslate.x = 0;
			svg.rootNode.currentTranslate.y = 0;
			break;
	}
	svg.rootNode.setAttribute('viewBox', viewVals.join(' '));
};

// zoom
//
// Zoom (magnify) the SVG in or out.
// To do an incremental zoom in/out just specify the direction.
// To do a jump in the zoom, just specify the factor
//
// direction is one of 'in', 'out', or null if factor is specified.
// factor is the scaling factor.  Default for in is 1.5 and out is 0.67.
//
// alternatively, direction can be 'to' and the factor would then be a
// specific scaling amount.
//
svgEvents.zoom = function(direction, factor) { 
	console.debug("ZOOM ", direction);
	if (direction == null) {
		if (factor > 1.0) {
			direction = 'in';
		} else {
			direction = 'out';
		}
	}

	console.debug(svg.rootNode.currentScale);
	switch (direction) {
		case 'in':
			if (factor == null) {
				factor = 1.5;
			}
			if (svg.rootNode.currentScale < 10) {
				svg.rootNode.currentScale = svg.rootNode.currentScale * factor;
			}
			break;
		case 'out':
			if (factor == null) {
				factor = 0.67;
			}
			if (svg.rootNode.currentScale > 0.1) {
				svg.rootNode.currentScale = svg.rootNode.currentScale * factor;
			}
			break;
		case 'to':
				svg.rootNode.currentScale = factor;
			break;
	}
	svg.rootNode.currentTranslate.x = -centerX * (svg.rootNode.currentScale - 1);
	svg.rootNode.currentTranslate.y = -centerY * (svg.rootNode.currentScale - 1);
};

// select
//
// Select both an item in the SVG and the corresponding data in the HTML
//
svgEvents.select = function(id) { 
	try {
		svgTarget = svg.svgDocument.getElementById(id);
		if (svgTarget) {
			svgEvents.svgOriginalItemColor = svgTarget.getAttribute('fill');
			svgTarget.setAttribute('fill', svgEvents.svgHighlightColor);
		}
		svgEvents.highlightRow(id);
	} catch (e) { }
};

// deselect
//
// deselect a currently selected item in both the SVG and HTML table
svgEvents.deselect = function(id) { 
	try {
		svgTarget = svg.svgDocument.getElementById(id);
		if (svgTarget) {
			svgTarget.setAttribute('fill', svgEvents.svgOriginalItemColor);
			svgEvents.highlightRow(-1);	
		}
	} catch (e) { }
};

// highlightRow
//
// hightlight a specified row in the table.  A non-existant rowNum will
// result in all rows being un-highlighted
//
svgEvents.highlightRow = function(rowNum) { 
	var table = document.getElementById("dataTable");
	// colorize rows
	for (var i = 1; i < table.rows.length; i++) {
		if (table.rows[i].cells[0].innerHTML == rowNum) {
			table.rows[i].style.backgroundColor = svgEvents.svgHighlightColor;
		} else {
			table.rows[i].style.backgroundColor = "";						
		}
	}
};

// startDrag
//
// initialize a mouse drag event to move the SVG by dragging the mouse.
//
svgEvents.startDrag = function(event) { 
	var x, y;
	
	if (window.ActiveXObject) {
	    x = window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
	    y = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	} else {
    	x = event.clientX + window.scrollX;
    	y = event.clientY + window.scrollY;
	}
    
    svgEvents.dragObj.cursorStartX = x;
	svgEvents.dragObj.cursorStartY = y;
	

	if (window.ActiveXObject) {
		svg.svgDocument.attachEvent("onmousemove", svgEvents.dragGo);
	    svg.svgDocument.attachEvent("onmouseup",   svgEvents.dragStop);
    	window.event.cancelBubble = true;
    	window.event.returnValue = false;
  	} else {
		svg.svgDocument.addEventListener("mousemove", svgEvents.dragGo,   true);
	    svg.svgDocument.addEventListener("mouseup",   svgEvents.dragStop, true);
	    event.preventDefault();
  	}
};

// dragGo
//
// Move the SVG according to mouse movements during a drag event
//
svgEvents.dragGo = function(event) { 

	var x, y;

	if (window.ActiveXObject) {
    	x = window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
		y = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	} else {
		x = event.clientX + window.scrollX;
		y = event.clientY + window.scrollY;
	}

	// divide the movement by 8 to make it a little less sensitive
	svgEvents.pan("left", (x - svgEvents.dragObj.cursorStartX) / 8);
	svgEvents.pan("up", (y - svgEvents.dragObj.cursorStartY) / 8);

	if (window.ActiveXObject) {
    	window.event.cancelBubble = true;
	    window.event.returnValue = false;
	} else {
		event.preventDefault();
	}
};

// dragStop
//
// The mouse button has been released from the drag event, do remove the
// mouse movement event listeners
//
svgEvents.dragStop = function(event) { 

	// Stop capturing mousemove and mouseup events.

	if (window.ActiveXObject) {
	    svg.svgDocument.detachEvent("onmousemove", svgEvents.dragGo);
    	svg.svgDocument.detachEvent("onmouseup",   svgEvents.dragStop);
	} else {
	    svg.svgDocument.removeEventListener("mousemove", svgEvents.dragGo,   true);
    	svg.svgDocument.removeEventListener("mouseup",   svgEvents.dragStop, true);
	}
};


// wheelZoom
//
// Zooms in and out based on wheel movement where
// delta > 0 means wheel was moved up and delte < 0 means wheel moved down
svgEvents.wheelZoom = function(delta) { 
        if (delta < 0) {
			svgEvents.zoom('out', 0.9);
        } else {
			svgEvents.zoom('in', 1.1);
        }
};

/** Event handler for mouse wheel event.
 */
svgEvents.wheel = function(event) { 
        var delta = 0;
        if (!event) { /* For IE. */
                event = window.event;
        }
        if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta/120;
                /** In Opera 9, delta differs in sign as compared to IE.
                 */
                if (window.opera) {
                        delta = -delta;
                }
        } else if (event.detail) { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
                delta = -event.detail/3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta) {
                svgEvents.wheelZoom(delta);
        }
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (event.preventDefault) {
                event.preventDefault();
        }
	event.returnValue = false;
};


// Associate desired functions to the main document in order to
// make the accessible to both the HTML and the SVG

window.zoom = svgEvents.zoom;
window.select = svgEvents.select;
window.deselect = svgEvents.deselect;
parent.document.select = svgEvents.select;
parent.document.deselect = svgEvents.deselect;

