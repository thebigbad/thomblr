var sys = require('sys');

var url = {
  regular: function (post) { return post['@'].url; },
  link: function (post) { return post['link-url']; },
  photo: function (post) {
    var tumblelog = post.tumblelog['@'].url.replace(/\/$/, ''),
        generic = post['photo-url'][0]['#'],
        link = post['photo-link-url'];
    if (!link || tumblelog == link.replace(/\/$/, '')) {
      return generic;
    };
    return link;
  },
  video: function (post) {
    var link = post['video-source'];
    return (link.indexOf('http') == 0) ? link : url.regular(post);
  }
};

var getUrl = function (post) {
  switch (post['@'].type) {
    case 'link':
      return url.link(post);
    case 'photo':
      return url.photo(post);
    case 'video':
      return url.video(post);
  }
  return url.regular(post);
};

var title = {
  none: getUrl,
  regular: function (post) {
    var t = post['regular-title'];
    return (t) ? t : title.none(post);
  },
  link: function (post) {
    var t = post['link-text'];
    return (t) ? t : title.none(post);
  },
  conversation: function (post) {
    var t = post['conversation-title'];
    return (t) ? t : title.none(post);
  },
  video: function (post) {
    var t = post['video-title'];
    return (t) ? t : title.none(post);
  }
};

var getTitle = function (post) {
  switch (post['@'].type) {
    case 'regular':
      return title.regular(post);
    case 'link':
      return title.link(post);
    case 'conversation':
      return title.conversation(post);
    case 'video':
      return title.video(post);
  }
  return title.none(post);
};

exports.serialize = function (post) {
  return { url: getUrl(post), title: getTitle(post) };
};
