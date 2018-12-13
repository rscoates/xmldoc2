(function () {

var sax;
var DEFAULT_OPTIONS = {
  trim: false, // sax.trim - trim/ignore whitespace, ignore comments 
  strict: true // sax.strict sax strict parsing
};

if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser) {
  // We're being used in a Node-like environment
  sax = require('sax');
}
else {
  // assume it's attached to the Window object in a browser
  sax = this.sax;

  if (!sax) // no sax for you!
    throw new Error("Expected sax to be defined. Make sure you're including sax.js before this file.");
}

/*
XmlElement is our basic building block. Everything is an XmlElement; even XmlDocument
behaves like an XmlElement by inheriting its attributes and functions.
*/

function XmlElement(tag, parent) {
  // Capture the parser object off of the XmlDocument delegate
  var parser = delegates[delegates.length - 1].parser;

  this.name = tag.name;
  this.attrs = tag.attributes || {};
  this.value = "";
  this.children = [];
  this.firstChild = null;
  this.lastChild = null;
  this.parent = parent || null;

  // Assign parse information
  this.line = parser.line;
  this.column = parser.column;
  this.position = parser.position;
  this.startTagPosition = parser.startTagPosition;
}

// Private methods

XmlElement.prototype._addChild = function(child) {
  // add to our children array
  this.children.push(child);

  // update first/last pointers
  if (!this.firstChild) this.firstChild = child;
  this.lastChild = child;
};

// SaxParser handlers

XmlElement.prototype._opentag = function(tag) {

  var child = new XmlElement(tag, this);

  this._addChild(child);

  delegates.unshift(child);
};

XmlElement.prototype._closetag = function() {
  delegates.shift();
};

XmlElement.prototype._text = function(text) {
  if (typeof this.children === 'undefined')
    return

  this.value += text;

  this._addChild(new XmlTextNode(text));
};

XmlElement.prototype._cdata = function(cdata) {
  this.value += cdata;

  this._addChild(new XmlCDataNode(cdata));
};

XmlElement.prototype._comment = function(comment) {
  if (typeof this.children === 'undefined')
    return

  this._addChild(new XmlCommentNode(comment));
};

XmlElement.prototype._error = function(err) {
  throw err;
};

// Public methods

/**
 * Destructor - use it to free the memory
 */
XmlElement.prototype.destroy = function () {
  for (var i = this.children.length - 1; i >= 0; i--) {
    this.children[i].destroy && this.children[i].destroy();
  }
  this.children = null;
  this.parent = null;
  this.name = null;
  this.attrs = null;
  this.firstChild = null;
  this.lastChild = null;
};

/**
 * Returns root element of the document
 * @return {XmlElement} root element of the document
 */
XmlElement.prototype.getRoot = function () {
  var node = this;
  while (node.parent) node = node.parent;
  return node;
};

/**
 * Returns elements by path relative to this Element
 * @param {SimplifiedXPath} path simplied xpath to elements relative to this Element
 * @return {XmlElement[]} elements which meets the criteria
 */
XmlElement.prototype.getAll = function (path) {
  if (typeof path !== "string") {
    throw Error("`path` must be a string");
  }
  var pathParts = [],
      partlyPath = "",
      parent = this,
      result = [],
      stack = [],
      element = null,
      pathToken = null,
      type = "element";

  // prepare
  if (/^\//.test(path)) {
    var root = this.getRoot();
    pathParts = path.substring(1).split("/");
    if (root.name !== pathParts.shift()) {
      return [];
    }
    stack.push(root);
  } else {
    pathParts = path.split("/");
    stack.push(this);
  }

  // get nodes
  while (pathParts.length > 0) {
    pathToken = pathParts.shift();
    result = [];

    if (pathToken === "") {
      throw Error("Not supported `//` in SimplifiedXPath");
    }


    // select node with defined index
    findIndex = 0; // xpath nodes are indexed from 1
    if (/\[\d+\]$/.test(pathToken)) {
      var match = pathToken.match(/\[(\d+)\]$/);
      pathToken = pathToken.substring(0, match.index);
      findIndex = parseInt(match[1]);
    }
    while (stack.length > 0) { 
      element = stack.pop();
      foundIndex = 0;
      for (var i = 0, max = element.children.length; i < max; i++) {
        if (element.children[i].type === type && (pathToken === "*" || element.children[i].name === pathToken)) {

          foundIndex += 1;

          // selects node with defined index
          if (findIndex) {
            if (findIndex === foundIndex) {
              result.push(element.children[i]);
              break;
            }
            continue;
          }

          // selects all corresponding elements
          result.push(element.children[i]);
        }
      }
    }
    stack = result;
  }
  return result;
};

/**
 * Returns first matched element by path relative to this Element
 * @param {SimplifiedXPath} path simplied xpath to elements relative to this Element
 * @return {XmlElement} element which meets the criteria or null
 */
XmlElement.prototype.get = function (path) {
  var nodes = this.getAll(path);
  return nodes.length > 0 ? nodes[0] : null;
};

// String formatting (for debugging)

XmlElement.prototype.toString = function(options) {
  return this.toStringWithIndent("", options);
};

XmlElement.prototype.toStringWithIndent = function(indent, options) {
  var s = indent + "<" + this.name;
  var linebreak = options && options.compressed ? "" : "\n";
  var preserveWhitespace = options && options.preserveWhitespace;

  for (var name in this.attrs)
    if (Object.prototype.hasOwnProperty.call(this.attrs, name))
        s += " " + name + '="' + escapeXML(this.attrs[name]) + '"';

  if (this.children.length === 1 && this.children[0].type !== "element") {
    s += ">" + this.children[0].toString(options) + "</" + this.name + ">";
  }
  else if (this.children.length) {
    s += ">" + linebreak;

    var childIndent = indent + (options && options.compressed ? "" : "  ");

    for (var i=0, l=this.children.length; i<l; i++) {
      s += this.children[i].toStringWithIndent(childIndent, options) + linebreak;
    }

    s += indent + "</" + this.name + ">";
  }
  else if (options && options.html) {
    var whiteList = [
      "area", "base", "br", "col", "embed", "frame", "hr", "img", "input",
      "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"
    ];
    if (whiteList.indexOf(this.name) !== -1) s += "/>";
    else s += "></" + this.name + ">";
  }
  else {
    s += "/>";
  }

  return s;
};

// Alternative XML nodes

function XmlTextNode (text) {
  this.text = text;
}

XmlTextNode.prototype.toString = function(options) {
  return formatText(escapeXML(this.text), options);
};

XmlTextNode.prototype.toStringWithIndent = function(indent, options) {
  return indent+this.toString(options);
};

function XmlCDataNode (cdata) {
  this.cdata = cdata;
}

XmlCDataNode.prototype.toString = function(options) {
  return "<![CDATA["+formatText(this.cdata, options)+"]]>";
};

XmlCDataNode.prototype.toStringWithIndent = function(indent, options) {
  return indent+this.toString(options);
};

function XmlCommentNode (comment) {
  this.comment = comment;
}

XmlCommentNode.prototype.toString = function(options) {
  return "<!--"+formatText(escapeXML(this.comment), options)+"-->";
};

XmlCommentNode.prototype.toStringWithIndent = function(indent, options) {
  return indent+this.toString(options);
};

// Node type tag

XmlElement.prototype.type = "element";
XmlTextNode.prototype.type = "text";
XmlCDataNode.prototype.type = "cdata";
XmlCommentNode.prototype.type = "comment";

/**
 * XmlDocument is the class we expose to the user, it represents root element of xml
 * @param {String} xml parsed xml string
 * @param {Object} [options]
 * @param {Boolean} [options.trim=false] sax.trim trim/ignore whitespace, ignore comments 
 *        true to ignore whitespace else false
 * @param {Boolean} [options.strict=true] sax strict parsing
 *        false to disable strict else true
 */
function XmlDocument(xml, options) {
  xml && (xml = xml.toString().trim());

  if (!xml)
    throw new Error("No XML to parse!");

  // merge options
  this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});

  // Stores doctype (if defined)
  this.doctype = "";

  // Expose the parser to the other delegates while the parser is running
  this.parser = sax.parser(this.options.strict, {
    trim: this.options.trim
  });
  addParserEvents(this.parser, this.options)

  // We'll use the file-scoped "delegates" var to remember what elements we're currently
  // parsing; they will push and pop off the stack as we get deeper into the XML hierarchy.
  // It's safe to use a global because JS is single-threaded.
  delegates = [this];

  this.parser.write(xml);

  // Remove the parser as it is no longer needed and should not be exposed to clients
  delete this.parser;
}

// make XmlDocument inherit XmlElement's methods
extend(XmlDocument.prototype, XmlElement.prototype);

XmlDocument.prototype._opentag = function(tag) {
  if (typeof this.children === 'undefined')
    // the first tag we encounter should be the root - we'll "become" the root XmlElement
    XmlElement.call(this,tag);
  else
    // all other tags will be the root element's children
    XmlElement.prototype._opentag.apply(this,arguments);
};

XmlDocument.prototype._doctype = function(doctype) {
  this.doctype += doctype;
}

// file-scoped global stack of delegates
var delegates = null;

/*
Helper functions
*/

function addParserEvents(parser, options) {
  parser.onopentag = parser_opentag;
  parser.onclosetag = parser_closetag;
  parser.ontext = parser_text;
  parser.oncdata = parser_cdata;
  if (!options.trim) {
    parser.oncomment = parser_comment;
  }
  parser.ondoctype = parser_doctype;
  parser.onerror = parser_error;
}

// create these closures and cache them by keeping them file-scoped
function parser_opentag() { delegates[0] && delegates[0]._opentag.apply(delegates[0],arguments) }
function parser_closetag() { delegates[0] && delegates[0]._closetag.apply(delegates[0],arguments) }
function parser_text() { delegates[0] && delegates[0]._text.apply(delegates[0],arguments) }
function parser_cdata() { delegates[0] && delegates[0]._cdata.apply(delegates[0],arguments) }
function parser_comment() { delegates[0] && delegates[0]._comment.apply(delegates[0],arguments) }
function parser_doctype() { delegates[0] && delegates[0]._doctype.apply(delegates[0],arguments) }
function parser_error() { delegates[0] && delegates[0]._error.apply(delegates[0],arguments) }

// a relatively standard extend method
function extend(destination, source) {
  for (var prop in source)
    if (source.hasOwnProperty(prop))
      destination[prop] = source[prop];
}

// escapes XML entities like "<", "&", etc.
function escapeXML(value){
  return value.toString().replace(/&/g, '&amp;').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

// formats some text for debugging given a few options
function formatText(text, options) {
  var finalText = text;

  if (options && options.trimmed && text.length > 25)
    finalText = finalText.substring(0,25).trim() + "…";
  if (!(options && options.preserveWhitespace))
    finalText = finalText.trim();

  return finalText;
}

// Are we being used in a Node-like environment?
if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser)
    module.exports.XmlDocument = XmlDocument;
else
    this.XmlDocument = XmlDocument;

})();

/**
 * @typedef {String} SimplifiedXPath
 * Allowed expressions:
 * name  selects element with name "name"
 * *     selects all children elements
 * /     path delimiter
 * [1]   selects node with index 1 (indexed from 1)
 */