const parser = require ('../lib/xmldoc.js');

var XmlDocument = require('../').XmlDocument;
var t = require('tap');
var xmlString1 = '<xml><a id="1"></a><b><a>xxx</a></b><a id="2"><c></c><d /></a></xml>';

t.test('getAll() - empty result - path: c', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("c");

  t.equal(a.length, 0);

  t.end();
});

t.test('getAll() - path: a', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("a");

  t.equal(a.length, 2);
  t.equal(a[0].attr.id, '1');
  t.equal(a[1].attr.id, '2')

  t.end();
});

t.test('getAll() - path: b/a', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("b/a");

  t.equal(a.length, 1);
  t.equal(a[0].val, 'xxx');
  
  t.end();
});

t.test('getAll() - path: b/a', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("b/a");

  t.equal(a.length, 1);
  t.equal(a[0].val, 'xxx');
  
  t.end();
});

t.test('getAll() - path: *', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("*");

  t.equal(a.length, 3);
  t.equal(a[0].name, 'a');
  t.equal(a[1].name, 'b');
  t.equal(a[2].name, 'a');
  
  t.end();
});

t.test('getAll() - path: a/*', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("a/*");

  t.equal(a.length, 2);
  t.equal(a[0].name, 'c');
  t.equal(a[1].name, 'd');
  
  t.end();
});

t.test('getAll() - path: a/*', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("a/*");

  t.equal(a.length, 2);
  t.equal(a[0].name, 'c');
  t.equal(a[1].name, 'd');
  
  t.end();
});

t.test('getAll() - path: /xml/a/*', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("a/*");

  t.equal(a.length, 2);
  t.equal(a[0].name, 'c');
  t.equal(a[1].name, 'd');
  
  t.end();
});

t.test('getAll() - path: a[2]', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.getAll("a[2]");

  t.equal(a.length, 1);
  t.equal(a[0].name, 'a');
  t.equal(a[0].attr.id, '2');
  
  t.end();
});

t.test('get() - path: a[2]', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.get("a[2]");

  t.ok(a);
  t.equal(a.name, 'a');
  t.equal(a.attr.id, '2');
  
  t.end();
});

t.test('get() - path: a[5]', function (t) {
  
  // test options.trim - ignore whitespace
  var parsed = new XmlDocument(xmlString1, {trim: true});
  var a = parsed.get("a[5]");

  t.equal(a, null);
  t.end();
});
