var pageControllerModule = (function($){
  var pageController = {};

  //ckeditor inline save plugin configuration.
  CKEDITOR.plugins.addExternal('inlinesave', '/revenant/ckeditor/inlinesave/', 'plugin.js' );
  CKEDITOR.disableAutoInline = true;

  //for clearing ckeditor cache and allowing set Authorization Header
  CKEDITOR.timestamp='ABCD';


//inline editor added on text element click
  pageController.edit = function() {
    $('.text--edit').on('click', function() {
      var dataCategory = $(this).attr('data-category');
      var data = $(this).data('complete-path');
      data.username = JSON.parse(sessionStorage.getItem('rev_auth')).username;
      var authBearer = 'Bearer ' + JSON.parse(sessionStorage.getItem('rev_auth')).access_token;
      // console.log('data here!', data);
      var el = document.querySelector('[data-category="'+ dataCategory +'"');
      if (!el.hasAttribute('id', data.xpath)) {
        el.setAttribute('id', data.xpath);
        CKEDITOR.config.inlinesave = {
          postUrl: '/revenant_page/page_content',
          postAuth: authBearer,
          postData: {data: data},
          useJson: true,
          onSave: function(editor) {
            // console.log('save success!', editor);
            return true;
          },
          onSuccess: function(editor, data) {
              // console.log('save successful', editor, data);
          },
          onFailure: function(editor, status, request) {
              // console.log('save failed', editor, status, request);
          },
          useJSON: true,
          useColorIcon: false
        };
        CKEDITOR.inline(el, {
          bodyId: data,
          title : 'test title',
          extraPlugins : 'inlinesave',
          allowedContent: true,
        });
      }
    });
  };

  // adds edit class and data to all text nodes
  pageController.addEditClass = function(){
    var body = document.getElementsByTagName('body')[0];
    function recurseAdd(element){
      if (element.childNodes.length > 0){
          for (var i = 0; i < element.childNodes.length; i++)
              recurseAdd(element.childNodes[i]);
      }
      if (element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && element.parentNode.nodeName != 'SCRIPT' && element.parentNode.nodeName != 'NOSCRIPT') {
        var completePath = pageModule.getCompletePath(element);
        element.parentNode.className += ' text--edit';
        element.parentNode.setAttribute('data-category', completePath.xpath);
        $('[data-category="' + completePath.xpath + '"]').data('complete-path', completePath);
        element.parentNode.setAttribute('contenteditable','true');
        if(element.parentNode.nodeName === 'A'){
          element.parentNode.onclick = function(e) {
            e.preventDefault();
          }
        }
      }
    }
    recurseAdd(body);
  };

  // removes edit class and data on all text nodes
  pageController.removeEditClass = function() {
      var body = document.getElementsByTagName('body')[0];
      function recurseRemove(element){
          if (element.childNodes.length > 0){
              for (var i = 0; i < element.childNodes.length; i++)
                  recurseRemove(element.childNodes[i]);
          }
          if (element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && element.parentNode.nodeName != 'SCRIPT' && element.parentNode.nodeName != 'NOSCRIPT') {
              var completePath = pageModule.getCompletePath(element);
              element.parentNode.classList.remove("text--edit");
              $('[data-category="' + completePath.xpath + '"]').removeData('complete-path');
              element.parentNode.removeAttribute('data-category');
              element.parentNode.removeAttribute('contenteditable');
              if(element.parentNode.nodeName === 'A'){
                  element.parentNode.onclick = null;
              }
          }
      }
      recurseRemove(body);
  };

  //appends login and and event handler for hiding/showing and authenticating.
  pageController.appendLogin = function() {
      (function() {
          templateModule.getCompiledTemplate('login')
              .then(function(html){
              $('body').prepend(html);
              $('.rev_login_reveal').on('click', function() {
                $('.rev_login__contaier').toggleClass('show');
                  pageController.loginAuthenticate();
              })
          });
      }());
  };

  //appends control panel for user and passes session variable with username to .hbs template
  pageController.appendControlPanel = function() {
      templateModule.getCompiledTemplate('user_control_panel')
          .then(function(html){
              var rev_auth = JSON.parse(sessionStorage.getItem('rev_auth'));
              $('body').prepend(html(rev_auth));
              $('.rev_logout').on('click', function() {
                  $('.rev_user_control_panel').remove();
                  pageController.removeEditClass();
                  sessionStorage.clear();
                  pageController.init();
              })
          });
  };

  //authenticates using D8 simple_oauth module parameters. Stores session var with tokens and username, removes login and calls functions for adding edit class and control panel.
  pageController.loginAuthenticate = function() {
    $('.rev_login__form').on('submit', function(e) {
      var username = $(this).find('input[title="username"]').val();
      var password = $(this).find('input[title="password"]').val();
        e.preventDefault();
        //Oauth POST
          data = {
            "grant_type": "password",
            "client_id": OAUTH_CLIENT_ID,
            "client_secret": OAUTH_CLIENT_SECRET,
            "username": username,
            "password": password,
          }
          $.ajax({
            url: "/oauth/token",
            method: "POST",
            headers: {'X-Requested-With': null},
            data: data,
          })
            .error(function(error){
            // console.log('oauth error', error)
          })
            .done(function (response, status, xhr) {
              // console.log('oauth response', response);
                sessionStorage.setItem( 'rev_auth', JSON.stringify({
                  "username": username,
                  "access_token":response.access_token,
                  "refresh_token": response.refresh_token
                }));
                pageModule.init();
                $('.rev_login').remove();
                pageController.addEditClass();
                pageController.edit();
                pageController.appendControlPanel();
            });
    })
  };

  //control module initializer, checks for session token and adds login or control panel on page load.
  pageController.init = function() {
    if (!sessionStorage.getItem('rev_auth')) {
        pageController.appendLogin();
    } else {
        pageController.addEditClass();
        pageController.edit();
        pageController.appendControlPanel();
    }
  };

  return {
    init : pageController.init
  }

})(jQuery);
