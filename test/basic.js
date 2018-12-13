var XmlDocument = require('../').XmlDocument
var t = require('tap')

t.test('verify sax global in browser', function (t) {

  // "un-require" the xmldoc module that we loaded up top
  delete require.cache[require.resolve('../')];

  // also un-require the actual xmldoc module pulled in by index.js ('../')
  delete require.cache[require.resolve('../lib/xmldoc.js')];

  // this signal will be picked up on by xmldoc.js
  global.xmldocAssumeBrowser = true;

  t.throws(function() {
    require('../');
  });

  // try again, but this time satisfy the sax check
  delete require.cache[require.resolve('../')];
  delete require.cache[require.resolve('../lib/xmldoc.js')];
  global.sax = {};
  require('../');
  t.ok(global.XmlDocument);

  t.end();
})

t.test('extend util', function(t) {
  delete require.cache[require.resolve('../')];
  delete require.cache[require.resolve('../lib/xmldoc.js')];
  Object.prototype.cruftyExtension = "blah";
  try {
    require('../');
  }
  finally {
    delete Object.prototype.cruftyExtension;
  }
  t.end();
})

t.test('parse xml', function (t) {

  var xmlString = '<hello>world</hello>';
  var parsed = new XmlDocument(xmlString);
  t.ok(parsed);
  t.throws(function() { new XmlDocument(); });
  t.throws(function() { new XmlDocument("  "); });
  t.end();
})

t.test('cdata handling', function (t) {

  var xmlString = '<hello><![CDATA[<world>]]></hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "<world>");
  t.end();
})

t.test('cdata and text handling', function (t) {

  var xmlString = '<hello>(<![CDATA[<world>]]>)</hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "(<world>)");
  t.end();
})

t.test('doctype handling', function (t) {

  var docWithType = new XmlDocument('<!DOCTYPE HelloWorld><hello>world</hello>');
  t.equal(docWithType.doctype, " HelloWorld");

  var docWithoutType = new XmlDocument('<hello>world</hello>');
  t.equal(docWithoutType.doctype, "");

  t.throws(function() {
    new XmlDocument('<hello><!DOCTYPE HelloWorld>world</hello>');
  });

  t.end();
})

t.test('comment handling', function (t) {

  var xmlString = '<hello><!-- World --></hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "");
  t.end();
})

t.test('comment and text handling', function (t) {

  var xmlString = '<hello>(<!-- World -->)</hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "()");
  t.end();
})

t.test('text, cdata, and comment handling', function (t) {

  var xmlString = '<hello>Hello<!-- , --> <![CDATA[<world>]]>!</hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "Hello <world>!");
  t.end();
})

t.test('text with elements handling', function (t) {

  var xmlString = '<hello>hello, <world/>!</hello>';
  var parsed = new XmlDocument(xmlString);
  t.equal(parsed.val, "hello, !");
  t.end();
})

t.test('text before root node', function (t) {

  var xmlString = '\n\n<hello>*</hello>';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('text after root node', function (t) {

  var xmlString = '<hello>*</hello>\n\n';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('text before root node with version', function (t) {

  var xmlString = '<?xml version="1.0"?>\n\n<hello>*</hello>';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('text after root node with version', function (t) {

  var xmlString = '<?xml version="1.0"?><hello>*</hello>\n\n';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('comment before root node', function (t) {

  var xmlString = '<!-- hello --><world>*</world>';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('comment after root node', function (t) {

  var xmlString = '<hello>*</hello><!-- world -->';
  var xml = new XmlDocument(xmlString);

  t.equal(xml.val, '*');
  t.equal(xml.children.length, 1);
  t.end();
})

t.test('error handling', function (t) {

  var xmlString = '<hello><unclosed-tag></hello>';

  t.throws(function() {
    var parsed = new XmlDocument(xmlString);
  });

  t.end();
})

t.test('tag locations', function (t) {

  var xmlString = '<books><book title="Twilight"/></books>';
  var books = new XmlDocument(xmlString);

  var book = books.children[0];
  t.equal(book.attr.title, "Twilight");
  t.equal(book.startTagPosition, 8);
  t.equal(book.line, 0);
  t.equal(book.column, 31);
  t.equal(book.position, 31);
  t.end();
})

t.test('toString', function (t) {

  var xmlString = '<books><book title="Twilight"/></books>';
  var doc = new XmlDocument(xmlString);

  t.equal(doc.toString(), '<books>\n  <book title="Twilight"/>\n</books>');
  t.equal(doc.toString({compressed:true}), '<books><book title="Twilight"/></books>');

  xmlString = '<hello> world </hello>';
  doc = new XmlDocument(xmlString);

  t.equal(doc.toString(), '<hello>world</hello>');
  t.equal(doc.toString({preserveWhitespace:true}), '<hello> world </hello>');

  xmlString = '<hello><![CDATA[<world>]]></hello>';
  doc = new XmlDocument(xmlString);

  t.equal(doc.toString(), '<hello><![CDATA[<world>]]></hello>');

  xmlString = '<hello>Hello<!-- , --> <![CDATA[<world>]]>!</hello>';
  doc = new XmlDocument(xmlString);

  t.equal(doc.toString({preserveWhitespace:true}), '<hello>\n  Hello\n  <!-- , -->\n   \n  <![CDATA[<world>]]>\n  !\n</hello>');

  xmlString = '<hello>hello, <world/>!</hello>';
  doc = new XmlDocument(xmlString);

  t.equal(doc.toString(), '<hello>\n  hello,\n  <world/>\n  !\n</hello>');

  xmlString = '<hello>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et accumsan nisi.</hello>';
  doc = new XmlDocument(xmlString);

  t.equal(doc.toString(), xmlString);
  t.equal(doc.toString({trimmed:true}), '<hello>Lorem ipsum dolor sit ame…</hello>')

  try {
    // test that adding stuff to the Object prototype doesn't interfere with attribute exporting
    Object.prototype.cruftyExtension = "You don't want this string to be exported!";

    var xmlString = '<books><book title="Twilight"/></books>';
    var doc = new XmlDocument(xmlString);

    t.equal(doc.toString(), '<books>\n  <book title="Twilight"/>\n</books>');
  }
  finally {
    delete Object.prototype.cruftyExtensionMethod;
  }

  xmlString = '<hello>world<earth/><moon/></hello>';
  doc = new XmlDocument(xmlString);
  t.equal(doc.toString({compressed:true}), xmlString);

  t.end();
})

t.test('parent attribute', function (t) {
  var xmlString = '<books><book title="Twilight"/></books>';
  var doc = new XmlDocument(xmlString);

  t.equal(doc.parent, null);
  t.ok(doc.children[0].parent);
  t.equal(doc.children[0].parent.name, 'books');
  t.end();
});

t.test('destroy()', function (t) {
  var xmlString = '<books><book title="Twilight"/></books>';
  var doc = new XmlDocument(xmlString);
  doc.destroy();
  t.ok(!doc.children);
  t.ok(!doc.parent);
  t.ok(!doc.lastChild);
  t.ok(!doc.firstChild);
  t.ok(!doc.attr);
  t.end();
});

t.test('getRoot()', function (t) {
  var xmlString = '<books><book title="Twilight"/><book><name></name></book></books>';
  var doc = new XmlDocument(xmlString);

  t.equal(doc.children[0].getRoot(), doc);
  t.equal(doc.children[1].children[0].getRoot(), doc);
  t.end();
});