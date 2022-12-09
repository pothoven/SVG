/* svgChart.js
 *
 * This file contains the functions for SVG charting
 *
 * author: Steven Pothoven
 */

// Declare an object to act as the namespace for the charting functions
// The SVG charting functions are static functions, not associated with an
// instance object.
//
var SVGChart = {
	width : 500,						// width of usable chart area (x-axis)
	height : 250,						// height of usable chart area (y-axis)
	origin : {'x' : 35, 'y' : 50 },		// coordinates of top of chart relative to overal graphic size
	titleOrigin : {'x' : 10, 'y' : 20 },// coordinates of chart title relative to overal graphic size
	yTitleOrigin : {'x' : 10, 'y' : 45 },// coordinates of y-axis title relative to overal graphic size
	yLabelRightTopOrigin : {'x' : 25, 'y' : 62 },// coordinates of top of y-axis labels relative to overal graphic size
	yMin : 0,							// minimum value on y-axis
	yMax : 100,							// maximum value on y-axis
	xLabelLength : 100,					// maximum length (in px) for x-axis label text
	xLabelHeight : Math.round(100 / 1.414213562373),	// height consumed by x-axis after tilting it 45 degrees (the length of the label / sqrt(2) )
	xLabelFontSize : 8,					// font size fo x-axis labels
	xIndexWidth : 15,					// default width of x-axis index
	intraItemSpacing : 5,				// required spacing between x-axis indicies
	xIndicies : [],						// collection of x-axis indicies
	keyValues : [],						// list of currently graphed data groups
	barGraphs : [],						// list of data groups rendered as bars (vs line charts)
	dataSets : []						// all the data being graphed
};

// setTitle
//
// helper function to set the chart title
//
SVGChart.setTitle = function(title) {
	// remove an existing title first
	SVGChart.removeElement("title");
	var chartTitle = SVGChart.drawText(title, SVGChart.titleOrigin.x, SVGChart.titleOrigin.y,"title","11pt","black","Veranda","bold");
	var chartTitleComment = svg.svgDocument.createComment("Add Chart Title");
	chartTitle.appendChild(chartTitleComment);
};


// setYLabel
//
// Set the Y-axis label of the chart.  The title will be added at the top
// of the Y-axis (per IBM guidelines) and the min and max values will be
// displayed on the bottom and top of the chart.  Also, the median value
// will be calculated and placed in the middle of the y-axis
//
SVGChart.setYLabel = function(title, min, max) {
	// remove an existing labels first
	SVGChart.removeElement("yLabel");
	SVGChart.yMin = parseFloat(min);
	SVGChart.yMax = parseFloat(max);
	var mid = (SVGChart.yMax + SVGChart.yMin) / 2;
	var yLabel = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	yLabel.setAttribute("id", "yLabel");
	yLabel.setAttribute("style", "stroke:none;");
	var yLabelComment = svg.svgDocument.createComment("Add Y-axis labels");
	yLabel.appendChild(yLabelComment);
	
	var labelTitle = SVGChart.drawText(title, SVGChart.yTitleOrigin.x, SVGChart.yTitleOrigin.y,"yTitle","10.5pt","gray","Veranda","bold",yLabel);
	var yHashGroup = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	yHashGroup.setAttribute("transform", "translate("+ SVGChart.yLabelRightTopOrigin.x +", "+ SVGChart.yLabelRightTopOrigin.y +")");
	yHashGroup.setAttribute("style", "text-anchor: end; baseline-shift: sub;");
	var maxHash = SVGChart.drawText(SVGChart.yMax, 0, 0,"maxHash","8pt","black","Veranda",null,yHashGroup);
	var midHash = SVGChart.drawText(mid, 0, Math.round(SVGChart.height / 2),"midHash","8pt","black","Veranda",null,yHashGroup);
	var minHash = SVGChart.drawText(SVGChart.yMin, 0, SVGChart.height,"minHash","8pt","black","Veranda",null,yHashGroup);
	
    yLabel.appendChild(yHashGroup);
    svg.baseNode.appendChild(yLabel);

	// refresh any currently charted data
    SVGChart.refreshChart();
};

// setXLabel
//
// Set the X-axis labels of the chart.  The title will be placed centered below the
// x-axis (per IBM guidelines).  The indicies are passed in as an array of x-axis
// hash values.  They will be sorted and made into a unique set of values.
// Hash marks for each value will be spaced evenly across the x-axis and in the
// case of more values than can ledgibly be displayed, it will skip values to ensure
// readability.
//
SVGChart.setXLabel = function(title, indicies) {
	SVGChart.removeElement("xLabel");
	var xLabel = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	xLabel.setAttribute("id", "xLabel");
	xLabel.setAttribute("style", "stroke:none;");
	var xLabelComment = svg.svgDocument.createComment("Add X-axis labels");
	xLabel.appendChild(xLabelComment);
	
	// Add X-axis title
	var labelTitle = SVGChart.drawText(title, Math.round(SVGChart.width / 2), SVGChart.height + SVGChart.origin.y + SVGChart.xLabelHeight,"xTitle","10.5pt","gray","Veranda","bold",xLabel);

	// calculate x-axis hash spacing based on number of data points
	var skipNumber = 0;
	var maxLabels = Math.round(SVGChart.width / (SVGChart.xIndexWidth + SVGChart.intraItemSpacing));
	SVGChart.xIndicies = indicies.unique();
	if (SVGChart.xIndicies.length > maxLabels) {
		skipNumber = Math.round(SVGChart.xIndicies.length / maxLabels);
	}
	if (SVGChart.xIndicies.length != maxLabels) {
		SVGChart.xIndexWidth = (SVGChart.width / SVGChart.xIndicies.length) - SVGChart.intraItemSpacing;
	}
	// initialize x,y coordinates
	// x starts half a hash distance before the start of the graph since the start
	//   of the for loop will move it to the correct location
	// y is constant as the bottom of the graph
	var x = SVGChart.origin.x - SVGChart.xLabelFontSize - (SVGChart.xIndexWidth / 2);
	var y = SVGChart.origin.y + SVGChart.height;
	// sometimes we need the actual computed spacing value, but more frequently
	// we also have to adjust it by the size of the label font, so to minimize
	// the redundant summation of these values, do it once up front
	var actualSpacing = SVGChart.xIndexWidth + SVGChart.xLabelFontSize + SVGChart.intraItemSpacing;
	
	// loop through all the x-axis labels and place them on the chart
	for (var i = 0; i < SVGChart.xIndicies.length; i++) {
   		var hashX = x + actualSpacing;
   		// draw the hash mark
   		// the hash marks are identified with the label value so they can be used
   		// to determine the x-coordinate for graphed data
		SVGChart.drawLine(hashX,y - 3,hashX,y + 3,'black',2,'hash:'+SVGChart.xIndicies[i],xLabel);

		// draw the label
		// the label is drawn at a 45 degree angle slightly below the hash mark
		// this is actually kind of tricky to do due to how rotations and translations
		// work in SVG.  What we do is draw the text a little in (x+5) and a little down (y+12)
		// from the hash mark location.  Then rotate is 45 degrees based on the origin of
		// the hash mark.  But that won't quite put it where you want it, so you have
		// to move it to the right the spacing amount with a translate.
		//
		var indexLabelT = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
		indexLabelT.setAttribute("transform", "translate(" + actualSpacing + "," + 0 + ")");
		
		var indexLabel = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
		indexLabel.setAttribute("transform", "rotate(45," + x + "," + y + ")");
		/* for placement debugging -- this will draw a red and blue line
		 * at the origin of the rotation 
		SVGChart.drawLine(x,y,x+30,y,"red",2,"xline:"+i,indexLabel);
		SVGChart.drawLine(x,y,x,y+30,"blue",2,"yline:"+i,indexLabel);
		*/
		var indexTitle = SVGChart.drawText(SVGChart.xIndicies[i], x+5, y+12,'title:'+SVGChart.xIndicies[i],SVGChart.xLabelFontSize,"black","Veranda",null,indexLabel);
		indexTitle.setAttribute("style", "stroke:none;");
		indexTitle.setAttribute("textLength", SVGChart.xLabelLength);
		indexTitle.setAttribute("lengthAdjust", "spacing");

		// add the rotated label to the translation
		indexLabelT.appendChild(indexLabel);
		// add the translation to the overall label
	    xLabel.appendChild(indexLabelT);
		x += SVGChart.xIndexWidth + SVGChart.intraItemSpacing;
		
		// if there are more labels than can fit on the graph, then we're skipping
		// some, but we still want to show hash marks for the skipped values
		// plus, the hash marks are used when graphing to locate the x-coordinate for the
		// graphed item, so they need to exist.
	    if (skipNumber  > 0) {
	   		hashX = x + actualSpacing;
	    	for (var j = 0; j < skipNumber; j++) {
				SVGChart.drawLine(hashX,y - 3,hashX,y + 3,'black',1,'hash:'+SVGChart.xIndicies[i+j+1],xLabel);
	    		x += SVGChart.xIndexWidth + SVGChart.intraItemSpacing;
	    	}
	    }
	    i += skipNumber;
	}
	// add the completed label to the graph
    svg.baseNode.appendChild(xLabel);
    
	// refresh any currently charted data
    SVGChart.refreshChart();
};

// setChartKey
//
// This function will build the key for the chart.  It will list each dataset
// graphed along with the color indicating that dataset.  The values passed in 
// are an array of dataset names.  This array cannot be sorted as the chart colors
// correspond to the array index.
SVGChart.setChartKey = function(values) {
	SVGChart.removeElement("key");
	
	var chartKey = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	chartKey.setAttribute("id", "key");
	var chartKeyComment = svg.svgDocument.createComment("Add Chart Key");
	chartKey.appendChild(chartKeyComment);

	var chartBoxG = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	chartBoxG.setAttribute("filter", "url(#shadow)");
	
	var boxX = (SVGChart.width + SVGChart.origin.x) + 10;
	var boxY = (SVGChart.height + SVGChart.origin.y) - (values.length * 20);
	var chartBox = SVGChart.drawRect(boxX,boxY,(values.length * 20),"125","white","keyBox",chartBoxG,null,null);
	chartBox.setAttribute("stroke", "black");
	chartBox.setAttribute("stroke-width", "3px");		
	chartBox.setAttribute("rx", "5");

    chartKey.appendChild(chartBoxG);
	
	// for each dataset listed in the values array, build a color square and label it
	var itemColorX = boxX + 10;
	var itemLabelX = itemColorX + 20;
	for (var i = 0; i < values.length; i++) {
		if (values[i] == null) {
			continue;
		}
		var itemY = boxY + 5 + (i * 20);
		var itemColor = SVGChart.drawRect(itemColorX,itemY,10,10,SVGChart.getColor(values[i]),"key:"+values[i],chartKey,null,"url(#3D-look)");
		var itemLabel = SVGChart.drawText(values[i], itemLabelX, itemY + 9,"keytitle"+values[i],"6.5pt","black","Veranda",null,chartKey);
		itemLabel.setAttribute("style", "stroke:none;");
	}

    svg.baseNode.appendChild(chartKey);
};

// removeDataGroup
//
// Remove an group of data from the chart
SVGChart.removeDataGroup = function(groupName) {
	SVGChart.removeElement(groupName);
	SVGChart.keyValues[SVGChart.keyValues.indexOf(groupName)] = null;
	if (SVGChart.barGraphs.indexOf(groupName) >= 0) {
		SVGChart.barGraphs = SVGChart.barGraphs.without(groupName);
		SVGChart.adjustBars();
	}
	SVGChart.setChartKey(SVGChart.keyValues.unique());
}

// chartData
//
// Chart a group of data elements
// type : line or bar
// dataGroupName : name to group this data by (ex. server name)
// dataSet : associative array of data values.  Data values are x, y axis values
//  	example:
//			[{ 'id' : idValue, 'x' : x-value, 'y' : y-value }, ... ]
//			[{ 'id' : "id0x086f3cc8", 'x' : "01:00:00", 'y' : "1.92"} ,
//			 { 'id' : "id0x075899d0", 'x' : "23:00:00", 'y' : "18.43"} ]
SVGChart.chartData = function(type, dataGroupName, dataSet) {
		SVGChart.removeDataGroup(dataGroupName);
		SVGChart.keyValues.push(dataGroupName);		
		var color = SVGChart.getColor(dataGroupName);

		// create a containing group element for the chart objects for this dataset
		groupElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
		groupElem.setAttribute("id", dataGroupName);
		var groupElemComment = svg.svgDocument.createComment("Add Data for dataset " + dataGroupName);
		groupElem.appendChild(groupElemComment);
		svg.baseNode.appendChild(groupElem);

		// save this dataset.  The values are saved so that we can refresh the
		// chart if parameters change - such as the min/max values of the y-axis.
		// Also, the data is sorted here by the x-axis value to make it easier to 
		// draw the line graphs
		SVGChart.dataSets[dataGroupName] = dataSet.sort(function(a, b){ return a.x>b.x?1:a.x<b.x?-1:0;/*return a.x - b.x;*/});
		
		switch (type) {
			case 'line':
				// first draw the line so that is it below the data points.
				// This is done by first extracting all the data coordinates, then
				//  build a SVG polyline using the path of coordinates
				var path = [];
				for (var i = 0; i < dataSet.length; i++) {
					var xCoord = SVGChart.getXcoord(dataSet[i].x);
					var yCoord = SVGChart.getYcoord(dataSet[i].y);
					path.push(xCoord);
					if (yCoord > 0) {
						path.push(yCoord);
					} else {
						path.push(SVGChart.height + SVGChart.origin.y);			
					}
				}
				SVGChart.drawPolyline(path,color,3,"line:"+dataGroupName,groupElem);

				// Now draw all the data points
				for (var i = 0; i < dataSet.length; i++) {
					var xCoord = SVGChart.getXcoord(dataSet[i].x);
					var yCoord = SVGChart.getYcoord(dataSet[i].y);
					if (yCoord > 0) {
						SVGChart.drawCircle(xCoord,yCoord,6,color,dataSet[i].id,groupElem,"0.7","url(#emboss)");
					}
				}
				break;
			case 'bar' :
				// keep track of how many groups of bar charts there are
				// This is necessary so we can shrink the bars as multiple data
				// sets are added or widen as removed
				SVGChart.barGraphs.push(dataGroupName);
				
				// draw the bars for this data set		
				for (var i = 0; i < dataSet.length; i++) {
					var xCoord = SVGChart.getXcoord(dataSet[i].x);
					// move x back half of the spacing in order to center it on the
					// hash mark
					xCoord -= (SVGChart.xIndexWidth / 2);
					var yCoord = SVGChart.getYcoord(dataSet[i].y);
					var barWidth = SVGChart.xIndexWidth;
					// The barHeight is really more list bar depth as the yCoord is
					// the top of the bar and the height drops the bar down to the y-axis
					// 1 is subtracted to adjust for the width of the y-axis line to make
					// the bar rest on top of the line, not in the middle of it.
					var barHeight = SVGChart.getBarHeight(dataSet[i].y) - 1;
					
					// only draw bars above the y-axis				
					if (barHeight > 0) {
						SVGChart.drawBar(xCoord,yCoord,barHeight,barWidth,color,dataSet[i].id,groupElem,"0.7","url(#3D-look)");
					}
					
				}

				break;
		}
		
	SVGChart.adjustBars();
				
	SVGChart.setChartKey(SVGChart.keyValues.unique());
};


// refreshChart
//
// Refresh the charted data
// This is typically invoked do to x or y axis changes
SVGChart.refreshChart = function() {
	var groupNames = SVGChart.keyValues.unique();
	for (var g = 0; g < groupNames.length; g++) {
		var dataGroupName = groupNames[g];
		var type = "line";
		if (SVGChart.barGraphs.indexOf(dataGroupName) >= 0) {
			type = "bar";
		}
		SVGChart.chartData(type, dataGroupName, SVGChart.dataSets[dataGroupName]);
	}
};



// adjustBars
//
// adjust existing bars
// If an existing bar was changed to a line or removed, then any remaining bars
// need to expand and shift locations.  Similarly, if a new bar was added, then
// the existing bars need to make room for it.
SVGChart.adjustBars = function() {

	var numBars = SVGChart.barGraphs.length;
	if (numBars > 0) {
		// determine width of a bar
		var barWidth = SVGChart.xIndexWidth / numBars;
		for (var i = 0; i < numBars; i++) {
			var aBarGroup = svg.svgDocument.getElementById(SVGChart.barGraphs[i]);
			var bars = aBarGroup.getElementsByTagName('rect');
			for (var j = 0; j < bars.length; j++) {
				// adjust coordinate based on bar number
				for (n = 0; n < bars[j].childNodes.length; n++) {
					// the original X coordinate is stored in a comment node
					if (bars[j].childNodes[n].nodeType == 8) {
						var origX = bars[j].childNodes[n].data;
						origX = origX.split(':');
						if (origX[0] == 'origX') {
							origX = origX[1];
							var newX = parseFloat(origX) + (i * barWidth);
							bars[j].setAttribute("x", newX);
						}
						break;					
					}
				}
				bars[j].setAttribute("width", barWidth);
			}
		}
	}
};
		

// getColor
//
// Get the color for a data group
SVGChart.getColor = function(dataGroup) {
	for (var i = 0; i < SVGChart.keyValues.length; i++) {
		if (SVGChart.keyValues[i] == dataGroup) {
			return SVGChart.getColorForNumber(i);
		}
	}
	return '000';
};


// getXcoord
//
// Get the X coordinate for a data item
SVGChart.getXcoord = function(dataId) {
	var xHashElem = svg.svgDocument.getElementById("hash:"+dataId);
	if (xHashElem) {
		return xHashElem.getAttribute("x1");
	}
};

// getYcoord
//
// Get the Y coordinate for a data value
SVGChart.getYcoord = function(value) {
	var Ycoord = 0;
	var baseline = SVGChart.height + SVGChart.origin.y;
	var barHeight = SVGChart.getBarHeight(value);
	if (barHeight > 0) {
		Ycoord =  baseline - barHeight;
	}
	return Ycoord;
};

// getBarHeight
//
// Get the height for a bar representing a data value
SVGChart.getBarHeight = function(value) {
	var Yscaling = SVGChart.height / (SVGChart.yMax - SVGChart.yMin);
	var barHeight = ((value * Yscaling) - (SVGChart.yMin * Yscaling));
	if (barHeight < 0) {
		barHeight = 0;
	}
	return barHeight;
};


// clone
//
// Extension to the Array class to clone an array
Array.prototype.clone = function(){
	return Array.apply(null,this); 
};

// unique
//
// Extension to the Array class to make the elements of the array unique
Array.prototype.unique = function() {
	var tmp = this.clone();
	tmp.sort();
	for (var i = tmp.length; i > 0 ; i--) {
		if (tmp[i] == tmp[i - 1]) {
			// remove the current item
			tmp.splice(i,1);
		}
	}
	if (tmp[0] === null) {
		tmp.splice(0,1);		
	}
	return tmp;
};

// getColorForNumber
//
// The one of IBM's 16 blessed chart colors
SVGChart.getColorForNumber = function(theNumber) {
	var colorNumber = theNumber % 16;
	var color = '000';
	switch (colorNumber) {
		case 0:
			color = '#AA0000';
			break;
		case 1:
			color = '#993366';
			break;
		case 2:
			color = '#77AA33';
			break;
		case 3:
			color = '#CC6600';
			break;
		case 4:
			color = '#BB77BB';
			break;
		case 5:
			color = '#BBDD66';
			break;
		case 6:
			color = '#FF7766';
			break;
		case 7:
			color = '#FF9900';
			break;
		case 8:
			color = '#EEDDEE';
			break;
		case 9:
			color = '#DDFFBB';
			break;
		case 10:
			color = '#FFCCCC';
			break;
		case 11:
			color = '#FFEE22';
			break;
		case 12:
			color = '#99CC33';
			break;
		case 13:
			color = '#99BBEE';
			break;
		case 14:
			color = '#99CC33';
			break;
		case 15:
			color = '#6699CC';
			break;
	}
	return color;
};

// removeElement
//
// Remove an SVG element from the SVG document
SVGChart.removeElement = function(elemId, tagName) {
	var anElem = svg.svgDocument.getElementById(elemId);
	if (anElem) {
		if (tagName) {
			if (anElem.tagName == tagName) {
				anElem.parentNode.removeChild(anElem);
			}
		} else {
			anElem.parentNode.removeChild(anElem);			
		}
	}
};

parent.document.removeElement = SVGChart.removeElement;

// drawCircle
//
// Add a circle to the chart. 
SVGChart.drawCircle = function(x,y,radius,color,id,owningElement,opacity,filter) {
	SVGChart.removeElement(id);
	var circleElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
	circleElem.setAttribute("stroke", color);
	circleElem.setAttribute("stroke-width", "1px");
	circleElem.setAttribute("cx", x);
	circleElem.setAttribute("cy", y);
	circleElem.setAttribute("r", radius);
	circleElem.setAttribute("fill", color);
	circleElem.setAttribute("id", id);
	if (opacity) {
		circleElem.setAttribute("fill-opacity", opacity);
	}
	if (circleElem) {
		circleElem.setAttribute("filter", filter);
	}
	circleElem.setAttribute("onmouseover", "parent.document.select('"+id+"')");
	circleElem.setAttribute("onmouseout", "parent.document.deselect('"+id+"')");
	circleElem.setAttribute("onclick", "parent.document.removeElement('"+id+"')");
    if (owningElement) {
    	owningElement.appendChild(circleElem);
    } else {
	    svg.baseNode.appendChild(circleElem);
    }
    return circleElem;
};

// drawLine
//
// Draw a line on the chart
SVGChart.drawLine = function(x1,y1,x2,y2,color,width,id,owningElement) {
	SVGChart.removeElement(id);
	var lineG = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
	lineG.setAttribute("style", "stroke:"+color+"; stroke-width:"+width+";");
	var lineElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'line');
	lineElem.setAttribute("x1", x1);
	lineElem.setAttribute("y1", y1);
	lineElem.setAttribute("x2", x2);
	lineElem.setAttribute("y2", y2);
	lineElem.setAttribute("id", id);
    lineG.appendChild(lineElem);
    if (owningElement) {
    	owningElement.appendChild(lineG);
    } else {
	    svg.baseNode.appendChild(lineG);
    }
    return lineElem;
};

// drawPolyline
//
// Draw a polyline on the chart
SVGChart.drawPolyline = function(coordinates,color,width,id,owningElement) {
	SVGChart.removeElement(id);
	var lineElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'polyline');
	var pointsString = "";
	for (var i = 0; i < coordinates.length; i+= 2) {
		pointsString += coordinates[i] + ',' + coordinates[i+1] + ' ';
	}
	lineElem.setAttribute("points", pointsString);
	lineElem.setAttribute("fill", "none");
	lineElem.setAttribute("stroke", color);
	lineElem.setAttribute("stroke-width", width);
	lineElem.setAttribute("id", id);
    if (owningElement) {
    	owningElement.appendChild(lineElem);
    } else {
	    svg.baseNode.appendChild(lineElem);
    }
    return lineElem;
};

// drawRect
//
// Draw a rectangle on the chart
SVGChart.drawRect = function(x,y,height,width,color,id,owningElement,opacity,filter) {
	SVGChart.removeElement(id);
	var rectElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
	rectElem.setAttribute("stroke", color);
	rectElem.setAttribute("stroke-width", "1px");		
	rectElem.setAttribute("x", x);
	rectElem.setAttribute("y", y);
	rectElem.setAttribute("height", height);
	rectElem.setAttribute("width", width);
	rectElem.setAttribute("fill", color);
	rectElem.setAttribute("id", id);
	if (opacity) {
		rectElem.setAttribute("fill-opacity", opacity);
	}
	if (filter) {
		rectElem.setAttribute("filter", filter);
	}
    if (owningElement) {
    	owningElement.appendChild(rectElem);
    } else {
	    svg.baseNode.appendChild(rectElem);
    }
    return rectElem;
}

// drawBar
//
// Draw a single bar for bar chart
SVGChart.drawBar = function(x,y,height,width,color,id,owningElement,opacity,filter) {
	var barElem = SVGChart.drawRect(x,y,height,width,color,id,owningElement,opacity,filter);
	barElem.setAttribute("onmouseover", "parent.document.select('"+id+"')");
	barElem.setAttribute("onmouseout", "parent.document.deselect('"+id+"')");
	barElem.setAttribute("onclick", "parent.document.removeElement('"+id+"')"); 
	// bars are sometimes adjusted, so this allows quick access to original location   
//	barElem.setAttribute("origX", x);    
	var origX = svg.svgDocument.createComment("origX:"+x);
	barElem.appendChild(origX);
    return barElem;
};

// drawText
//
// add text to the chart
SVGChart.drawText = function(title,x,y,id,size,color,fontname,weight,owningElement) {
	var textElem = svg.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
	textElem.setAttribute("x", x);
	textElem.setAttribute("y", y);
	if (id) {
		textElem.setAttribute("id", id);
	}
	if (size) {
		textElem.setAttribute("font-size", size);
	} else {
		textElem.setAttribute("font-size", "10.5pt");		
	}
	if (color) {
		textElem.setAttribute("fill", color);
	} else {
		textElem.setAttribute("fill", "black");		
	}
	if (fontname) {
		textElem.setAttribute("font-family", fontname);
	} else {
		textElem.setAttribute("font-family", "Veranda");		
	}
	if (weight) {
		textElem.setAttribute("font-weight", weight);		
	}	
	var textNode = svg.svgDocument.createTextNode(title);
	textElem.appendChild(textNode);

    if (owningElement) {
    	owningElement.appendChild(textElem);
    } else {
	    svg.baseNode.appendChild(textElem);
    }
    
    return textElem;
};

