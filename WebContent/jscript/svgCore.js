var ELEMENT_NODE 				= 1;
var	ATTRIBUTE_NODE				= 2;
var	TEXT_NODE					= 3;
var	CDATA_SECTION_NODE			= 4;	
var	ENTITY_REFERENCE_NODE		= 5;
var	ENTITY_NODE					= 6;
var	PROCESSING_INSTRUCTION_NODE	= 7;
var	COMMENT_NODE				= 8;
var	DOCUMENT_NODE				= 9;
var	DOCUMENT_TYPE_NODE			= 10;
var	DOCUMENT_FRAGMENT_NODE		= 11;
var	NOTATION_NODE				= 12;

var svg = {
	svgDocument : null,
	rootNode : null,
	baseNode : null,
	accumulator : null,	 // holds the serialized XML 

	// svgInitialize
	// 
	// This function is invoked by the SVG when it is done loading in order
	// for the HTML page to gain access to the SVG object (SVGDocument)
	// 			
	initialize : function(evt) { 
		if (typeof top != 'undefined') {
			top.svg = this;
		}
		this.svgDocument = evt.target.ownerDocument;
		this.rootNode = evt.target; // this.svgDocument.firstChild;
		this.baseNode = this.svgDocument.getElementById("svgBase");
	},

	elementToString : function(element) {
		if (element){
			var attribute;
			var i;
			svg.accumulator += "<" + element.nodeName;
			// Add the attributes
			for (i = element.attributes.length-1; i>=0; i--){
				attribute = element.attributes.item(i); 
				svg.accumulator += " " + attribute.nodeName + '="' + attribute.nodeValue+ '"';
			}
			// Run through any children
			if (element.hasChildNodes()){
				var children = element.childNodes;
				svg.accumulator += ">";
				for (i=0; i<children.length; i++){
					switch(children.item(i).nodeType){
						case ELEMENT_NODE : 
							svg.elementToString(children.item(i)); // RECURSE!! 
							break;
						case TEXT_NODE : 
							svg.accumulator += svg.escape(children.item(i).nodeValue);
							break;
						case COMMENT_NODE : 
							svg.accumulator += "<!-- "
							svg.accumulator += svg.escape(children.item(i).nodeValue);
							svg.accumulator += " -->"
							break;
						case CDATA_SECTION_NODE :
							svg.accumulator += "\x3c![CDATA[";	// unescaped < 
							svg.accumulator += children.item(i).nodeValue;
							svg.accumulator += "]]\x3e"; 		// unescaped > 
							break;
					}
				}
				svg.accumulator += "</" + element.nodeName + ">"; 
			} else {
				svg.accumulator += " />"; 
			}
		}
		return svg.accumulator;
	},

	escape : function(markup) {
		markup = markup.replace(/&/g, "&amp;");
		markup = markup.replace(/</g, "&lt;");
		markup = markup.replace(/>/g, "&gt;");
		return markup; 
	},
	serialize : function() { 
		var content = svg.elementToString(svg.rootNode);
		svg.accumulator = "";
		return '<?xml version="1.0" ?>' + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">' + content;
	}
	
};
