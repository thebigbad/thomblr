var sys = require('sys'),
    fs = require('fs'),
    http = require('http'),
    path = require('path'),
    urlParse = require('url').parse,
    paperboy = require('paperboy'),
    xml2js = require('xml2js'),
    webroot = path.join(path.dirname(__filename), 'static'),
    router = require('./router'),
    tumblr = require('./tumblr');

router.server.listen(2666);

paperboy.filepath = function (webroot, urlString) {
  var url = urlParse(urlString),
      file = url.pathname.split('/').pop(),
      fp = path.normalize(path.join(webroot, file));
  return([null, fp]);
};

var getPage = function (email, password, offset, size, data, end) {
  var path = [
    '/api/likes?email=',
    email,
    '&password=',
    password,
    '&size=',
    size,
    '&start=',
    offset
  ].join('');
  var client = http.createClient(80, 'www.tumblr.com');
  var crequest = client.request('GET', path, {'host': 'www.tumblr.com'});
  crequest.on('response', function (cresponse) {
    if (cresponse.statusCode != 200) { return end(); }
    var parser = new xml2js.Parser();
    var body = '';
    cresponse.setEncoding('utf8');
    cresponse.on('data', function (chunk) { body += chunk; });
    cresponse.on('end', function (chunk) {
      if (chunk) { body += chunk; }
      parser.parseString(body);
    });
    parser.addListener('end', function(result) {
      var posts = (result.posts.post.length == undefined) ? [result.posts.post] : result.posts.post;
      data(posts);
      if (posts.length < size) { return end(); }
      getPage(email, password, offset + size, size, data, end);
    });
  });
  crequest.end();
};

/**
 * subroutines
 **/

var sendStatic = function (request, response) {
  paperboy.deliver(webroot, request, response);
};

/**
 * static assets
 **/

router.get('thomblr/index.html', sendStatic);
router.get('thomblr/fav.png', sendStatic);

/**
 * the one and only interesting endpoint
 **/
router.get('thomblr/bookmarks.html', function (request, response) {
  var url = urlParse(request.url, true);
  if (!url.query) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }
  var email = encodeURIComponent(url.query.email),
      password = encodeURIComponent(url.query.password);
  if (!email || !password) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }
  response.writeHead(200);
  var header = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ];
  response.write(header.join('\n') + '\n');
  getPage(email, password, 0, 50,
    function (posts) {
      posts.forEach(function (post) {
        var link = tumblr.serialize(post);
        var html = [
          '<DT><A HREF="',
          link.url.replace('"', '\\"'),
          '">',
          link.title.replace('<', '&lt;').replace('>', '&gt;'),
          '</A>\n'
        ].join('');
        response.write(html);
      });
    },
    function () {
      response.end('</DL><p>\n');
    }
  );
});
