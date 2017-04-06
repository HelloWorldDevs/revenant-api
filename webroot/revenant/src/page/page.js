
//SET DEV ENVIRONMENT IN STRING FOR LOCAL OR REMOTE URL
//TODO: need to configure local hosting CORS, for now leave as PROD
var DEV_CONFIGS = {
  LOCAL: 'http://revenant-api.dev/',
  PROD: 'http://revenant-api.bfdig.com/'
};

var DEV_CONFIG = DEV_CONFIGS.PROD;


//pageModule is responsible for rendering page display, makes checks for content and updates page text nodes, also adds needed scripts and configuration
var pageModule = (function ($) {

  var page = {};

  //gets text from element
  page.getText = function (e) {
    var text = e.parentNode.textContent;
    return text;
  };

  //gets the element by xpath
  page.getElementByXpath = function (path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };

  //gets the xpath to an element
  page.getXPath = function (element) {
    var xpath = '';
    //  loop walks up dom tree for all nodes
    for (; element && element.nodeType == 1; element = element.parentNode) {
      // gets the element node index for each element
      var id = $(element.parentNode).children(element.tagName).index(element) + 1;
      // if greateer than one puts in brackets
      id > 1 ? (id = '[' + id + ']') : (id = '');
      // prepends to the element tagname and id to the xpath
      xpath = '/' + element.tagName.toLowerCase() + id + xpath;
    }
    return xpath;
  };

  //method for constructing revenant content item data model.
  page.getCompletePath = function (e) {
    var url = window.location.hostname + window.location.pathname;
    var xpath = page.getXPath(e.parentNode);
    var title = document.title;
    var oldText = e.parentElement.innerHTML;
    var completePath = {
      url: url,
      xpath: xpath,
      title: title,
      oldText: oldText
    };
    return completePath;
  };

  //helper function for posting to rev-api, creates page and default content item.
  page.createRevenantPage = function (currentPage) {
    console.log('inside create page, current revenant', currentPage);
    var authBearer = 'Bearer ' + JSON.parse(sessionStorage.getItem('rev_auth')).access_token;
    $.ajax({
      type: 'POST',
      url: DEV_CONFIG + 'revenant_page/page_create',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/hal+json',
        'Authorization': authBearer,
        'X-Requested-With': null
      },
      data: JSON.stringify(currentPage),
      success: function (data, status, xhr) {
        console.log('revenant create page post success', data)
      },
      error: function (xhr, ajaxOptions, thrownError) {
        console.log("revenant create page post xhr: ", xhr);
        console.log("revenant create page post xhr: ", thrownError);
      }
    });
  };

  ///check for revenant content for current page, appends all content and invokes pageController callback.
  page.revenantContentCheck = function (callback) {
    $(function () {
      const pageLocation = window.location.hostname + window.location.pathname;
      $.ajax({
        method: 'GET',
        url: DEV_CONFIG + 'rev-content/?url=' + pageLocation,
        success: function (data) {
          console.log('revenant content check success', data);
          //if no revenant nodes are sent and the user is logged in, send current revenant data to be created as revenant revenant entity reference
          if (!data.length && sessionStorage.getItem('rev_auth')) {
            var currentPage = {};
            currentPage.title = window.location.hostname + window.location.pathname;
            currentPage.url = pageLocation;
            page.createRevenantPage(currentPage);
          }

          // if data is received replace all corresponding text nodes with new text using saved xpath.
          else {
            data.forEach(function (item) {
              //excludes default content item.
              if (!item || item.field_xpath.includes('default')) {
                return
              }
              var editedNode = page.getElementByXpath(item.field_xpath);
              editedNode.innerHTML = item.field_new_content;
            })
          }
          if (callback) {
            callback();
          }
        },
        error: function (err) {
          console.log("revenant content check error: ", err);
        }
      });
    })
  };

  //prepends styling scripts to page
  page.addCSS = function () {
    $("<link/>", {
      rel: "stylesheet",
      type: "text/css",
      href: DEV_CONFIG + "/revenant/src/css/main.css"
    }).appendTo("head");
  };

  //loads ckeditor via ajax.
  page.addCKEditor = function () {
    return $.ajax({
      url: DEV_CONFIG + 'revenant/lib/ckeditor/ckeditor.js',
      dataType: 'script',
      cache: true
    });
  };

  //configures ckeditor
  page.ckEditorConfigure = function () {
    //ckeditor inline save plugin configuration.
    CKEDITOR.plugins.addExternal('inlinesave', DEV_CONFIG + 'revenant/lib/ckeditor/plugins/rev-inlinesave/', 'plugin.js');
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.dtd.$editable = {
      a: 1,
      address: 1,
      article: 1,
      aside: 1,
      blockquote: 1,
      body: 1,
      details: 1,
      div: 1,
      fieldset: 1,
      figcaption: 1,
      footer: 1,
      form: 1,
      h1: 1,
      h2: 1,
      h3: 1,
      h4: 1,
      h5: 1,
      h6: 1,
      header: 1,
      hgroup: 1,
      main: 1,
      nav: 1,
      p: 1,
      pre: 1,
      section: 1
    };

    //uncomment and run for clearing ckeditor cache and allowing modification of plugins. Used when modifying inline save plugin.
    CKEDITOR.timestamp = 'ABCD';
  };

  //spin js loading gif function, used during content check and insertion
  page.spinnerLoad = function () {
    $spinnerDiv = $('<div id="spinner-overlay" style="position: fixed; height: 100%; z-index: 9999; top: 0;bottom: 0;left: 0;right: 0;opacity: .9;background-color: #fff;"><div id="loading-spinner"><div></div>')
    $('body').append($spinnerDiv);

    var opts = {
      lines: 13 // The number of lines to draw
      , length: 28 // The length of each line
      , width: 14 // The line thickness
      , radius: 42 // The radius of the inner circle
      , scale: 1 // Scales overall size of the spinner
      , corners: 1 // Corner roundness (0..1)
      , color: '#000' // #rgb or #rrggbb or array of colors
      , opacity: 0.25 // Opacity of the lines
      , rotate: 0 // The rotation offset
      , direction: 1 // 1: clockwise, -1: counterclockwise
      , speed: 1 // Rounds per second
      , trail: 60 // Afterglow percentage
      , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
      , zIndex: 2e9 // The z-index (defaults to 2000000000)
      , className: 'spinner' // The CSS class to assign to the spinner
      , top: '50%' // Top position relative to parent
      , left: '50%' // Left position relative to parent
      , shadow: false // Whether to render a shadow
      , hwaccel: false // Whether to use hardware acceleration
      , position: 'absolute' // Element positioning
    };
    var target = document.getElementById('loading-spinner')
    var spinner = new Spinner(opts).spin(target);
  }


  //initializes pageModule, check for content and passes in pageController as callback
  page.init = function (callback) {
    page.spinnerLoad();
    page.addCKEditor().done(function () {
      page.addCSS();
        page.ckEditorConfigure();
        page.revenantContentCheck(callback);
    });
  };

  //export other needed functions that pageController will use.
  return {
    revenantContentCheck: page.revenantContentCheck,
    getCompletePath: page.getCompletePath,
    init: page.init,
  }

})(jQuery);

//THIS IS WHAT STARTS EVERYTHING :)
pageModule.init(pageControllerModule.init);
