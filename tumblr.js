var sys = require('sys');

var regular = function (post) {
  return post['@'].url;
};

var link = function (post) {
  return post['link-url'];
};

var photo = function (post) {
  var tumblelog = post.tumblelog['@'].url.replace(/\/$/, ''),
      generic = post['photo-url'][0]['#'],
      link = post['photo-link-url'];
  if (!link || tumblelog == link.replace(/\/$/, '')) {
    return generic;
  };
  return link;
};

exports.serialize = function (post) {
  switch (post['@'].type) {
    case 'quote':
    case 'conversation':
    case 'regular':
      return regular(post);
    case 'link':
      return link(post);
    case 'photo':
      return photo(post);
  }
  return sys.inspect(post);
};
