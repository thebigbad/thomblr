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

/**
 * subroutines
 **/

var sendStatic = function (request, response) {
  paperboy.deliver(webroot, request, response);
};

/**
 * static assets
 **/

router.get('thoms/index.html', sendStatic);
router.get('thoms/fav.png', sendStatic);

/**
 * the one and only interesting call
 **/

router.get('thoms/likes', function (request, response) {
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
  var path = '/api/likes?email=' + email + '&password=' + password;
  var client = http.createClient(80, 'www.tumblr.com');
  var crequest = client.request('GET', path, {'host': 'www.tumblr.com'});
  crequest.on('response', function (cresponse) {
    if (cresponse.statusCode != 200) {
      response.writeHead(400);
      response.end('Bad Request');
      return;
    }
    var parser = new xml2js.Parser();
    var body = '';
    cresponse.setEncoding('utf8');
    cresponse.on('data', function (chunk) { body += chunk; });
    cresponse.on('end', function (chunk) {
      if (chunk) { body += chunk; }
      parser.parseString(body);
    });
    parser.addListener('end', function(result) {
      response.writeHead(200);
      if (!result.posts.post) { return response.end(''); }
      result.posts.post.forEach(function (post) {
        response.write(tumblr.serialize(post) + '\n');
      });
      response.end();
    });
  });
  crequest.end();
});
