HAL.Browser = Backbone.Router.extend({
  initialize: function(opts) {
    opts = opts || {};

    this.vent = _.extend({}, Backbone.Events),
    $container = opts.container || $('#browser');
    this.entryPoint = opts.entryPoint || '/';

    // TODO: don't hang currentDoc off namespace
    this.vent.bind('response', function(e) {
      window.HAL.currentDocument = e.resource || {};
    });

    this.vent.bind('location-go', _.bind(this.loadUrl, this));

    HAL.client = new HAL.Http.Client({ vent: this.vent });

    var browser = new HAL.Views.Browser({ vent: this.vent, entryPoint: this.entryPoint });
    browser.render()

    $container.html(browser.el);
    this.vent.trigger('app:loaded');

    if (window.location.hash === '') {
      window.location.hash = this.entryPoint;
    }

    if(location.hash.slice(1,9) === 'NON-GET:') {
      new HAL.Views.NonSafeRequestDialog({
            href: location.hash.slice(9),
            vent: this.vent
          }).render({});
    }
  },

  routes: {
    '*url': 'resourceRoute'
  },

  loadUrl: function(url) {
    if (this.getHash() === url) {
      HAL.client.get(url);
    } else {
      window.location.hash = url;
    }
  },

  getHash: function() {
    return window.location.hash.slice(1);
  },

  resourceRoute: function() {
    var url = location.hash.slice(1),
    exp = /^access_token/;

    console.log('target url changed to: ' + url);
    if(exp.test(url)) {
      var sp = url.split('='), token = sp[1];
      localStorage.setItem('access_token', token)
      window.location.hash = this.entryPoint;
    } else if (url.slice(0,8) !== 'NON-GET:') {
      this.vent.trigger('app:login', localStorage.getItem('access_token'));
      HAL.client.get(url);
    }
  }
});
