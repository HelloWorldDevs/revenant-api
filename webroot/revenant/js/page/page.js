var pageModule = (function($) {
  var page = {};

  page.getText = function(e) {
    var text = e.parentNode.textContent;
    return text;
  };

  page.getElementByXpath = function(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };

  page.getXPath = function(element) {
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
  page.getCompletePath = function(e) {
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
  page.createRevenantPage = function(currentPage) {
      // console.log('current revenant', currentPage);
      var authBearer = 'Bearer ' + JSON.parse(sessionStorage.getItem('rev_auth')).access_token;
      $.ajax({
          type: 'POST',
          url: 'http://revenant-api.bfdig.com/revenant_page/page',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/hal+json',
              'Authorization': authBearer,
              'X-Requested-With': null
          },
          data: JSON.stringify(currentPage),
          success: function(data) {
              console.log('create page post success', data)
          },
          error: function (err) {
              console.log("create page post error: " + err);
          }
      });
  };

  ///check for revenant content for current page, appends all content and invokes pageController callback.
  page.revenantContentCheck = function(callback) {
      const pageLocation = window.location.hostname + window.location.pathname;
      $.ajax({
          method: 'GET',
          url:'http://revenant-api.bfdig.com/rev-content/?url=' + pageLocation,
          success: function(data) {
              console.log('success again!', data);
              //if no revenant nodes are sent and the user is logged in, send current revenant data to be created as revenant revenant entity reference
              if (!data.length &&  sessionStorage.getItem('rev_auth')) {
                  var currentPage = {};
                  currentPage.title = window.location.hostname + window.location.pathname;
                  currentPage.url = pageLocation;
                  page.createRevenantPage(currentPage);
              }

              // if data is received replace all corresponding text nodes with new text using saved xpath.
              else {
                  data.forEach(function(item) {
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
              console.log("AJAX error in request: " + err);
          }
      });
  };


  //initializes check for content and passes in pageController as callback
  page.init = function(callback) {
      // if (typeof(RevenantAPIServer) == "undefined") {
      //     console.log('undefined')
      //     RevenantAPIServer = "omsi-test.bfdig.com";
      //     page.RevenantAPIServer = RevenantAPIServer;
      // } else {
      //     page.RevenantAPIServer = RevenantAPIServer;
      //
      //     console.log(page.RevenantAPIServer);
      // }
    page.revenantContentCheck(callback);
  };

  return {
    // RevenantAPIServer: page.RevenantAPIServer,
    getCompletePath : page.getCompletePath,
    init : page.init,
  }

})(jQuery);

pageModule.init(pageControllerModule.init);