
## Introduction

`xmldoc2` lets you parse XML documents with ease. It's a pure-JavaScript, one-file XML document class with a single dependency on the excellent [`sax`][sax] parser.

FORK of [nfarina's xmldoc](https://github.com/nfarina/xmldoc) introduced in [blog post][blog].

  [blog]: http://nfarina.com/post/34302964969/a-lightweight-xml-document-class-for-nodejs-javascript

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for details (built with [GitHub Changelog Generator](https://skywinder.github.io/github-changelog-generator/)).

## Installation

~~npm install xmldoc2~~

Or just download the repository and include it in your `node_modules` directly. Or just download the [single JS file][blob]!

  [blob]: https://github.com/jaroslavmoravec/xmldoc2/blob/master/lib/xmldoc2.js

## Installation - React Native

I haven't tested this myself but [installing `buffer` and `stream` separately](https://github.com/nfarina/xmldoc/issues/38) may be necessary for `xmldoc` to work on React Native:

~~npm install buffer stream xmldoc~~

## Usage

```js
var xmldoc = require('xmldoc');

var document = new xmldoc.XmlDocument("<some>xml</some>", {/*options*/});

// do things, your code here...

document.destroy();
```

## Classes

The primary exported class is `XmlDocument`, which you'll use to consume your XML text. `XmlDocument` contains a hierarchy of `XmlElement` instances representing the XML structure.

Both `XmlElement` and `XmlDocument` contain the same members and methods you can call to traverse the document or a subtree.

## Options

* `trim` `{Boolean}` - passed to sax, trims/ignores whitespace and ignore comments 
* `strict` `{Boolean}` - passet to sax see [strict argument](https://github.com/isaacs/sax-js#arguments)

## Members

* `name` - the node name, like "tat" for `<tat>`. XML "namespaces" are ignored by the underlying [sax-js](https://github.com/isaacs/sax-js) parser, so you'll simply get "office:body" for `<office:body>`.
* `attrs` - an object dict containing attribute properties, like `bookNode.attr.title` for `<book title="...">`.
* `value` - the string "value" of the node, if any, like "world" for `<hello>world</hello>`.
* `children` - an array of `XmlElement` children of the node.
* `firstChild`, `lastChild` - pretty much what it sounds like; null if no children
* `line`, `column`, `position`, `startTagPosition` - information about the element's original position in the XML string.
* `parent` `{XmlElement}` the parent node or null for root element

Each member defaults to a sensible "empty" value like `{}` for `attrs`, `[]` for `children`, and `""` for `val`.

It is recommended to work with elements (childrens) by Array's methods like `Array.prototype.forEach()`, `Array.prototype.filter()`, `Array.prototype.find()`, `Array.prototype.map()`, `Array.prototype.reduce()`, ...

### Example of find

We want to find name of author, which has proper name (`isProper=true`):

```js
let xmlString = `<book>
  <author>
    <name isProper="true">George R. R. Martin</name>
  </author>
  <author>
    <name>John Smith</name>
  </author>
</book>`;

let xml = new XmlDocument(xmlString, {trim: true});
let properName = xml.getAll("author/name").find(name => name.attrs.isProper === "true");
console.log(properName && properName.value); // -> George R. R. Martin
```

## Methods

All methods with `child` in the name operate only on direct children; they do not do a deep/recursive search.

It's important to note that `xmldoc` is designed for when you know exactly what you want from your XML file. For instance, it's great for parsing API responses with known structures, but it's not great at teasing things out of HTML documents from the web.

If you need to do lots of searching through your XML document, I highly recommend trying a different library like [node-elementtree](https://github.com/racker/node-elementtree).

### destroy()

Destructor. Use it always when you finish the processing with xml to help garbage collector free the memory

### getRoot()

Returns root element of xml

### getAll(path)

Returns elements found by path

* `path` `{String}` simplified xpath relative to current node
  * `/` path elements delimter
  * `[n]` where `n` is number - returns nth element, indexed from `1` (by W3 standard of XPath)
  * `*` returns all children of node
  * path started with `/` means absolute path, eg. get `a` element by `/xml/a` for xml `<xml><a /></xml>`

Returns

* `{XmlElement[]}` - array of found xml elements

### get(path) 

Returns found element or nothing, same as [getAll()](#getAll) method but returns only one element or `null`

* `path` `{String}` simplified xpath relative to current node see [getAll()](#getAll(path))

Returns

* `{XmlElement}` found element else null

### toString([options])

This is just an override of the standard JavaScript method, it will give you a string representation of your XML document or element. Note that this is for debugging only! It is not guaranteed to always output valid XML.

The default implementation of `toString()`, that is, the one you get when you just `console.log("Doc: " + myDoc)` will pretty-print the XML with linebreaks and indents. You can pass a couple options to control the output:

```js
xml.toString({compressed:true}) // strips indents and linebreaks
xml.toString({trimmed:true}) // trims long strings for easier debugging
xml.toString({preserveWhitespace:true}) // prevents whitespace being removed from around element values
```

Putting it all together:

```js
var xml = "<author><name>looooooong value</name></author>";
console.log("My document: \n" + new XmlDocument(xml).toString({trimmed:true}))
```

Prints:

    My Document:
    <hello>
      loooooooo…
    </hello>

## Feedback

Feel free to file issues or hit me up on [Twitter][twitter].

  [underscore]: http://underscorejs.org
  [XPath]: http://en.wikipedia.org/wiki/XPath
  [twitter]: http://twitter.com/nfarina
  [sax]: https://github.com/isaacs/sax-js
