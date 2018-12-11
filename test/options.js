const parser = require ('../lib/xmldoc.js');

var XmlDocument = require('../').XmlDocument;
var t = require('tap');

t.test('options.trim - ignore whitespace', function (t) {
  
  var xmlString = '<xml> <a1> </a1>\n<!--comment--><a2 /> <a3> </a3><a4> x </a4></xml>';

  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString, {trim: true});
  t.equal(parsed.options.trim, true);
  t.equal(parsed.children.length, 4);
  t.equal(parsed.children[0].val, "");
  t.equal(parsed.children[2].val, "");
  t.equal(parsed.children[3].val, "x");
  t.end();
});

t.test('options.strict - sax parsing strict', function (t) {
  var xmlString = '<xml><a1> </a1>\n<a2 /> <a3> </a3></xml>';
  var parsed = new XmlDocument(xmlString, {strict: false});
  t.equal(parsed.options.strict, false);
  t.end();
});