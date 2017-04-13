
//pageControllerModule is responsible for attaching extra views, editor classes, data categories, and adds event handlers to pageevent handlers to page. Is initialized as a callback in pageModule.init, and fires different behavior depending on if user is logged in or not.
var pageControllerModule = (function($){
  var pageController = {};

  //adds ckedittor inline and inline save handlers to editor instances.
  pageController.editHandler = function () {

    //data saved on text node with jQuery, needed to send to D8
    var data = $(this).data('complete-path');

    //needed parameters for author and authorization sent to D8
    data.username = JSON.parse(sessionStorage.getItem('rev_auth')).username;
    var authToken = JSON.parse(sessionStorage.getItem('rev_auth')).access_token;

    //specific element selected by data-category attribute to initialize ckeditor with
    var el = document.querySelector('[data-category="' + $(this).attr('data-category') + '"');

    //make sure editor instance does not exist already by setting unique xpath attribute for check
    if (!el.hasAttribute('id', data.xpath)) {
      el.setAttribute('id', data.xpath);

      //configure ckeditor instance
      CKEDITOR.config.inlinesave = {
        postUrl: DEV_CONFIG + 'revenant_page/page_content',
        postAuth: 'Bearer ' + authToken, //custom config set by KW in inline save plugin, is and xhr authorization header.
        postData: {data: data},
        useJson: true,
        onSave: function (editor) {
          //destory ckeditor instance and remove contenteditable attribute
          editor.destroy();
          el.removeAttribute('contenteditable');
          return true;
        },
        onSuccess: function (editor, data) {
          console.log('save successful', editor, data);
        },
        onFailure: function (editor, status, request) {
          console.log('save failed', editor, status, request);
        },
        useJSON: true,
        useColorIcon: false
      };

      //ckeditor simpleupload images add authorization header.
      CKEDITOR.on('instanceReady', function(e) {
          e.editor.on( 'simpleuploads.startUpload' , function(ev) {
              var extraHeaders = {
                  'Authorization': 'Bearer ' + authToken
              };
              ev.data.extraHeaders = extraHeaders;
          });
      });

      //ckeditor instantiation happens here, when passing element into method, toolbar configuration also needs to happen here.
      var editor = CKEDITOR.inline(el, {
        bodyId: data,
        extraPlugins: 'inlinesave,simpleuploads',
        postAuth: 'Bearer ' + authToken, //custom config set by KW in simpleuploads plugin, is and xhr authorization header.
        filebrowserImageUploadUrl: DEV_CONFIG + 'revenant_page/page_content/image',
        postAuth: 'Bearer ' + authToken,
        allowedContent: true,
        toolbarGroups : [
          { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
          { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
          { name: 'links', groups: [ 'links' ] },
          { name: 'forms', groups: [ 'forms' ] },
          { name: 'tools', groups: [ 'tools' ] },
          { name: 'others', groups: [ 'others' ] },
          { name: 'insert', groups: [ 'insert' ] },
          '/',
          { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
          { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
          { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
          { name: 'styles', groups: [ 'styles' ] },
          { name: 'colors', groups: [ 'colors' ] },
          { name: 'about', groups: [ 'about' ] }
        ],
        removeButtons : 'Image,Maximize,Table,Anchor,Indent,Outdent,Blockquote,Styles,Format,About'
      });
    }
  };


  //add controle handler to all text--edit class elements
  pageController.editAddHandler = function () {
    $('.text--edit').on('click', pageController.editHandler)
  };

  //login keyBind function, checks for keys pressed at once for showing revenant login.
  pageController.loginKeyBind = function() {
    var map = {}; // You could also use an array
    onkeydown = onkeyup = function(e){
      e = e || event; // to deal with IE
      if (e.type === 'keydown') {
          map[e.keyCode] = true
      } else  if (e.type === 'keyup') {
          map[e.keyCode] = false
      }
      if(map[17] && map[18] && map[82]) { // COMMAND + OPT + R
       if($('.rev_login').css('display') === 'none') {
         $('.rev_login').fadeIn();
       } else {
         $('.rev_login').fadeOut();
       }
      }
    }
  };

  //elements to skip in recurseAdd function, do not add edit class to these, only to their parent containers.
  pageController.skipElements = ['SCRIPT','NOSCRIPT','B','SPAN','I','STRONG','EM','A'];

  //recurse add function, checks for appropriate text nodes on page, adds editable attributes and data to page elements.
  pageController.recurseAdd = function(element) {
    if (element.childNodes.length > 0) {
      for (var i = 0; i < element.childNodes.length; i++)
        this.recurseAdd(element.childNodes[i]);
    }
    //TODO: add different check for recurse add, must add to anchor elements that are not within a content editable area.
    if ((element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && pageController.skipElements.indexOf(element.parentNode.nodeName) <= 0) && (element.parentNode.nodeName != 'A' &&  $(element).parents('.text--edit').length === 0)) {
      //get completePath function returns all data needed to send to D8
      var completePath = pageModule.getCompletePath(element);

      //add edit class for blue border
      element.parentNode.className += ' text--edit';

      //add xpath data-category, which is use as selector for creating ckeditor instance
      element.parentNode.setAttribute('data-category', completePath.xpath);

      //set completePath data using jQuery data method. Retrieved later on editor initialize to send to D8
      $('[data-category="' + completePath.xpath + '"]').data('complete-path', completePath);

      //set content editable attribute for ckeditor
      element.parentNode.setAttribute('contenteditable', 'true');

      //set to prevent actions on anchor clicks, TODO: get working for stand alone anchors as well.
      if (element.parentNode.nodeName === 'A') {
        element.parentNode.onclick = function (e) {
          e.preventDefault();
        }
      }
    }
  };

  //recurse remove function, destroys ckeditor instances and removes attributes needed for editing/sending data
  pageController.recurseRemove = function(element) {
    if (element.childNodes.length > 0) {
      for (var i = 0; i < element.childNodes.length; i++)
        this.recurseRemove(element.childNodes[i]);
    }
    var completePath = pageModule.getCompletePath(element);
    element.parentNode.classList.remove("text--edit");
    $('[data-category="' + completePath.xpath + '"]').removeData('complete-path');
    element.parentNode.removeAttribute('data-category');
    element.parentNode.removeAttribute('contenteditable');
    for (name in CKEDITOR.instances) {
      CKEDITOR.instances[name].destroy(true);
    }
    if (element.parentNode.nodeName === 'A') {
      element.parentNode.onclick = null;
    }
  };

  // calls recurseAdd on body
  pageController.addEditClass = function () {
    var body = document.getElementsByTagName('body')[0];
    pageController.recurseAdd(body);
  };

  // calls recurseRemove on body
  pageController.removeEditClass = function () {
    var body = document.getElementsByTagName('body')[0];
    pageController.recurseRemove(body);
  };


  //appends login and and event handler for hiding/showing and authenticating.
  pageController.appendLogin = function () {
    (function () {
      //TODO??: use ajax and handlebars templats! Would be so much nicer, was working initially but then CORS :(
      var LoginTemplate = $('<div class="rev_login" style="display: none;"><button class="rev_login_reveal">Revenant</button><div class="rev_login__contaier"><h2>Revenant Login</h2><form class="rev_login__form" method="post" action="submit.data"> <input type="text" title="username" placeholder="username" /><input type="password" title="password" placeholder="password" /><button type="submit" class="btn">Login</button><a class="forgot" href="#">Forgot Username?</a></form></div></div>');
      //TODO??: use template functionality here ???
      // templateModule.getCompiledTemplate('login')
      //     .then(function (html) {
      $('body').prepend(LoginTemplate);

      $('.rev_login_reveal').on('click', function () {
        $('.rev_login__contaier').toggleClass('show');
        pageController.loginAuthenticate();
      });
      // });
    }());
  };

  //appends control panel for user and passes session variable with username to .hbs template
  pageController.appendControlPanel = function () {
    var UserControlPanelTemplate = function (username) {
      return $('<div class="rev_user_control_panel"><h4 class="rev_user">Currently Logged in as: ' + username + '</h4><button class="rev_logout">Logout of Revenant</button></div>')
    };
    //TODO??: readd template functionality here as well ???
    // templateModule.getCompiledTemplate('user_control_panel')
    //     .then(function (html) {
    var rev_auth = JSON.parse(sessionStorage.getItem('rev_auth'));
    var UserControlPanel = UserControlPanelTemplate(rev_auth.username);
    $('body').prepend(UserControlPanel);

    //logout handler, unbind and bind handler to avoid repetition
    $('.rev_logout').off('click').on('click', function () {
      $('.rev_user_control_panel').remove();

      //remove all edit handlers from text--edit elements
      $('.text--edit').unbind('click', pageController.editHandler);

      //remove all edit classes
      pageController.removeEditClass();

      //clear session storage of tokens
      sessionStorage.clear();

      //append login and bind keydown keyup
      pageController.appendLogin();
      pageController.loginKeyBind();
    });
    // });
  };


  //authenticates using D8 simple_oauth module parameters. Stores session var with tokens and username, removes login and calls functions for adding edit class and control panel.
  pageController.loginAuthenticate = function () {

    //remove submit handler before applying again.
    $('.rev_login__form').off('submit').on('submit', function (e) {
      e.preventDefault();

      //credentials needed for authorization
      var username = $(this).find('input[title="username"]').val(),
        password = $(this).find('input[title="password"]').val(),
        origin = window.location.host;
      var auth_data = {
        "origin": origin,
        "username": username,
        "password": password
      };

      //post to authorization endpoint
      $.post( DEV_CONFIG + "revenant_page/page_auth", JSON.stringify(auth_data))
        .error(function (error) {
          console.log('oauth error', error)
        })
        .done(function (response, status, xhr) {
          console.log(response, status, xhr);
          var response_data = JSON.parse(response);
          sessionStorage.setItem('rev_auth', JSON.stringify({
            "username": username,
            "access_token": response_data.access_token,
            "refresh_token": response_data.refresh_token
          }));
          //since authentication is needed to create revenant page entity reference, must check for content to initialize page in D8 and initialize controllers again
          pageModule.revenantContentCheck(pageController.init);

          //remove login
          $('.rev_login').remove();
        });
    })
  };

  //pageController module initializer, checks for authorized user session token and adds login or control panel on page load. Adds edit class if user is authenticated.
  pageController.init = function () {
    console.log('pageControllerInit, add login or handlers');
    if (!sessionStorage.getItem('rev_auth')) {
      console.log('no rev-auth');
      pageController.appendLogin();
      pageController.loginKeyBind();
    } else {
      pageController.addEditClass();
      pageController.editAddHandler();
      pageController.appendControlPanel();
    }
    $('#spinner-overlay').fadeOut();
  };

  //exports page initializer for use in pageModule
  return {
    init : pageController.init
  }

})(jQuery);
