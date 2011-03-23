var http = require('http');
var url_parse = require('url').parse;

var routes = {};

var methods = ['get', 'put', 'post', 'delete'];

methods.forEach(function (method) { routes[method] = []; });

var addRoute = function (method, pattern, callback) {
  if (!(pattern instanceof RegExp)) {
    pattern = new RegExp(
      '^\/' + pattern.replace(/\//g, '\\\/').replace(/\:\w+/g, '([^\/]+)') + '$'
    );
  }
  // TODO: generate regex from string pattern like Davis
  routes[method].push({ regex: pattern, callback: callback });
};

methods.forEach(function (method) {
  exports[method] = function (pattern, callback) {
    addRoute(method, pattern, callback);
  };
});

exports.notFound = function (response) {
  response.writeHead(404);
  response.end('Not Found\n');
};

exports.server = http.createServer(function (request, response) {
  var method = request.method.toLowerCase();
  var path = url_parse(request.url).pathname.replace(/\/$/, '');
  console.log(method + ': ' + path);
  var matchingRoutes = routes[method].filter(function (route) {
    return route.regex.test(path);
  });
  if (path == '' && exports.index) {
    matchingRoutes = [ { callback: exports.index } ];
  }
  // TODO: handle no matches 404
  if (matchingRoutes.length == 0) { return exports.notFound(response); }
  // TODO: handle multiple matches 5**
  var route = matchingRoutes[0];
  var match = path.match(route.regex);
  match.shift();
  route.callback.apply(route.callback, [request, response].concat(match));
});
