/*  Simple XML library, version 0.8.1
 *  author: Steven Pothoven
 * 
 * This library currently has two components.
 * 1) XML
 *    This object allow XML DOM traversal and manipulation using XPaths in a
 *    cross-browser manner
 * 2) XSLT
 *    This object provides XSL Transformations in a cross-browser manner
/*--------------------------------------------------------------------------*/


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


//
// XML
//
function XML(xmlDom) {
	this.version = '0.8.1';
	this.isIE = window.ActiveXObject;
	if (xmlDom != null) {
		this.xmlDom = xmlDom;
	} else {
		// create an empty document
		if (this.isIE) {
	    	Try.these (
    			function() { axDom = new ActiveXObject("MSXML2.DOMDocument.5.0"); },
	    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument.4.0"); },
	    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument.3.0"); },
	    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument"); },
	    		function() { axDom = new ActiveXObject("Microsoft.XmlDom"); }
		    );
		    this.xmlDom = axDom;
		} else {
			this.xmlDom = document.implementation.createDocument("", "", null);
		}
	}
};

// load
//
// Loads an XML file from an URL
XML.prototype.load = function(url) {
	this.xmlDom.async = false;
	this.xmlDom.load(url);
};

// loadXML
//
// Loads XML data
XML.prototype.loadXML = function(xmlData) {
	if (this.isIE) {
       this.xmlDom.async = false;
	   this.xmlDom.loadXML(xmlData);
	} else {
	   var parser=new DOMParser();
	   this.xmlDom = parser.parseFromString(xmlData,"text/xml");
	}
};

// getNode
//
// get a single node from the XML DOM using the XPath
XML.prototype.getNode = function(xpath) {
	if (this.isIE) {
		var result = this.xmlDom.selectSingleNode(xpath);
	} else {
		var evaluator = new XPathEvaluator();
		var result = evaluator.evaluate(xpath, this.xmlDom, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
	}
	return result;
};

// getNodeValue
//
// get the value of a the element specified by the XPAth in the XML DOM 
XML.prototype.getNodeValue = function(xpath) {
	var value = null;
	try {
	var node = this.getNode(xpath);
	
	if (this.isIE && node) {
		value = node.text;
	} else if (!this.isIE && node.singleNodeValue) {
		value = node.singleNodeValue.textContent;
	}		
	} catch (e) {}
	
	return value;
};

// getNodes
//
// get a multiple nodes from the XML DOM using the XPath
XML.prototype.getNodes = function(xpath) {
	var nodes = [];
	if (this.isIE) {
		var result = this.xmlDom.selectNodes(xpath);
		for (var i = 0; i < result.length; i++) {
			var aNode = result[i];
			nodes.push(aNode);
		}
	} else {
		var evaluator = new XPathEvaluator();
		var result = evaluator.evaluate(xpath, this.xmlDom, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		while ((aNode = result.iterateNext()) != null) {
			 nodes.push(aNode);
		}
	}
	return nodes;
};

// getNodeValues
//
// get the values of the elements specified by the XPath in the XML DOM 
XML.prototype.getNodeValues = function(xpath) {
	var values = [];
	try {
		var nodes = this.getNodes(xpath);
	
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];

			if (this.isIE && node) {
				value = node.text;
			} else if (!this.isIE) {
				value = node.firstChild.nodeValue;
			}		
			values.push(value);
		}
	} catch (e) {}
	
	return values;
};

// getNodeAsXml
//
// get the XML contents of a node specified by the XPath
XML.prototype.getNodeAsXml = function(xpath) {
	var str = null;
	var aNode = this.getNode(xpath);
	try {
		if (this.isIE) {
			str = aNode.xml;
		} else {
			var serializer = new XMLSerializer();
			str = serializer.serializeToString(aNode.singleNodeValue);
		} 
	} catch (e) {
		str = "ERROR: No such node in XML";
	}
	return str;		
};

// prettyPrintXml
//
// Converts pointy brackets into their HTML escape code equivalents so we can print out XML.
//
XML.prototype.prettyPrintXml = function(xpath) {
	content = this.getNodeAsXml(xpath);
	if (content == null) 
		return null; 
	content = content.replace(/&/g, "&amp;");
	content = content.replace(/</g, "&lt;"); 
	content = content.replace(/>/g, "&gt;<br/>");
    return content; 
};



// updateNodeValue
//
// update a specific element value in the XML DOM
XML.prototype.updateNodeValue = function(xpath, newvalue) {
	var node = this.getNode(xpath);
	var changeMade = false;
	newvalue = newvalue.trim();
		
	if (this.isIE && node) {
		if (node.text != newvalue) {
			node.text = newvalue;
			changeMade = true;
		}
	} else if (!this.isIE && node.singleNodeValue) {
		if (node.singleNodeValue.textContent != newvalue) {
			node.singleNodeValue.textContent = newvalue;
			changeMade = true;
		}
	} else {
		if (newvalue.length > 0) {
			this.insertNode(xpath);
			changeMade = this.updateNodeValue(xpath, newvalue);
		}
	}		
	
	return changeMade;
};
	
// insertNode
//
// insert a new element (node) into the XML document based on the XPath
XML.prototype.insertNode = function(xpath) {
	var xpathComponents = xpath.split("/");
	var newChildName = xpathComponents.last();
	var parentPath = xpath.substr(0, xpath.length - newChildName.length - 1);
	var qualifierLoc = newChildName.indexOf("[");
	// remove qualifier for node being added
	if (qualifierLoc != -1) {
		newChildName = newChildName.substr(0, qualifierLoc);
	}
	var node = this.getNode(parentPath);
	var newChild = null;
	if (this.isIE && node)	{
		newChild = this.xmlDom.createElement(newChildName);
		node.appendChild(newChild);
	} else if ((!this.isIE) && node.singleNodeValue) {
		newChild = this.xmlDom.createElement(newChildName);
		node.singleNodeValue.appendChild(newChild);
	} else {
		// add the parent, then re-try to add this child
		var parentNode = this.insertNode(parentPath);
		newChild = this.xmlDom.createElement(newChildName);
		parentNode.appendChild(newChild);
	}
	return newChild;
};

// removeNode
//
// remove an element (node) from the XML document based on the xpath
XML.prototype.removeNode = function(xpath) {
	var node = this.getNode(xpath);
	var changed = false;
	if (this.isIE && node)	{
		node.parentNode.removeChild(node);
		changed = true;
	} else if ((!this.isIE) && node.singleNodeValue) {
		node.singleNodeValue.parentNode.removeChild(node.singleNodeValue);
		changed = true;
	}
	return changed;
};



//
// XSLT Processor
//
function XSLT(xslUrl) {
	this.isIE = window.ActiveXObject;
	if (this.isIE) {
		var xslDom = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
		xslDom.async = false;
		xslDom.load(xslUrl);
		if (xslDom.parseError.errorCode != 0) {
			var strErrMsg = "Problem Parsing Style Sheet:\n" +
							" Error #: " + xslDom.parseError.errorCode + "\n" +
							" Description: " + xslDom.parseError.reason + "\n" + 
							" In file: " + xslDom.parseError.url + "\n" +
							" Line #: " + xslDom.parseError.line + "\n" +
							" Character # in line: " + xslDom.parseError.linepos + "\n" +
							" Character # in file: " + xslDom.parseError.filepos + "\n" +
							" Source line: " + xslDom.parseError.srcText;
			alert(strErrMsg);
			return false; 
		}
		var xslTemplate = new ActiveXObject("Msxml2.XSLTemplate");
		xslTemplate.stylesheet = xslDom;
		this.xslProcessor = xslTemplate.createProcessor();
	} else {
		var xslDom = document.implementation.createDocument("", "", null);
		xslDom.async = false;
		xslDom.load(xslUrl);
		this.xslProcessor = new XSLTProcessor();
		this.xslProcessor.importStylesheet(xslDom);
		}
};

// transform
//
// Transform an XML document
XSLT.prototype.transform = function(xml, params) {
	// set stylesheet parameters
	for (var param in params) {
		if (typeof params[param] != 'function') {
			if (this.isIE) {
				this.xslProcessor.addParameter(param, params[param]);
			} else {
				this.xslProcessor.setParameter(null, param, params[param]);
			}
		}
	}

	if (this.isIE) {
		this.xslProcessor.input = xml.xmlDom;
		this.xslProcessor.transform();
		var output = this.xslProcessor.output;
	} else {
		var resultDOM = this.xslProcessor.transformToDocument(xml.xmlDom);
		var serializer = new XMLSerializer();
		var output = serializer.serializeToString(resultDOM);
	}
	return output;
};

// FROM PROTOTYPE LIBRARY
var Try = {
  these: function() {
    var returnValue;

    for (var i = 0; i < arguments.length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) {}
    }

    return returnValue;
  }
}


// showXML
//
// display raw XML data in a new window
window.showXML = function(xmlData) {
	var prettyXSL = new XSLT("xsl/xmlverbatimwrapper.xsl");
	var prettyXMLDOM = new XML();
	prettyXMLDOM.loadXML(xmlData);
	prettyXML = prettyXSL.transform(prettyXMLDOM); 
	
	xmlWin = this.open(null, 'xmlWin');
	xmlWin.document.open();
	xmlWin.document.write(prettyXML);
	xmlWin.document.close();
	return xmlWin;
};

