
//pageControllerModule is responsible for attaching extra views, editor classes, data categories, and adds event handlers to pageevent handlers to page. Is initialized as a callback in pageModule.init, and fires different behavior depending on if user is logged in or not.
var pageControllerModule = (function($){
  var pageController = {};

  //adds ckedittor inline and inline save handlers to editor instances.
  pageController.editHandler = function () {

    //data saved on text node to send to D8
    var data = $(this).data('complete-path');

    //needed parameters for author and authorization sent to D8
    data.username = JSON.parse(sessionStorage.getItem('rev_auth')).username;
    var authBearer = 'Bearer ' + JSON.parse(sessionStorage.getItem('rev_auth')).access_token;

    //specific element selected by data-category attribute to initialize ckeditor with
    var el = document.querySelector('[data-category="' + $(this).attr('data-category') + '"');

    //make sure editor instance does not exist already by setting unique xpath attribute for check
    if (!el.hasAttribute('id', data.xpath)) {
      el.setAttribute('id', data.xpath);

      //configure ckeditor instance
      CKEDITOR.config.inlinesave = {
        postUrl: DEV_CONFIG + 'revenant_page/page_content',
        postAuth: authBearer, //custom config set by KW in inline save plugin, is and xhr authorization header.
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

      //ckeditor toolbar configuration
      CKEDITOR.inline(el, {
        bodyId: data,
        extraPlugins: 'inlinesave,widgetselection,widget,filetools,lineutils,notification,notificationaggregator,uploadwidget,uploadimage',
          imageUploadUrl: '/uploader/upload.php?type=Images',
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
        removeButtons : 'Maximize,Table,Anchor,Indent,Outdent,Blockquote,Styles,Format,About'
      });
    }
  }


  //inline editor added on text element click
  pageController.editAddHandler = function () {
    $('.text--edit').on('click', pageController.editHandler)
  };

  pageController.loginKeyBind = function() {
    var map = {}; // You could also use an array
    onkeydown = onkeyup = function(e){
      e = e || event; // to deal with IE
      map[e.keyCode] = e.type == 'keydown';
      /* insert conditional here */
      if(map[17] && map[18] && map[82]) { // CTRL+SHIFT+A
       if($('.rev_login').css('display') === 'none') {
         $('.rev_login').fadeIn();
       } else {
         $('.rev_login').fadeOut();
       }
      }
    }
  };

  //elements to skip in recurseAdd function
  pageController.skipElements = ['SCRIPT','NOSCRIPT','B','SPAN','I','STRONG','EM','A'];

  pageController.recurseAdd = function(element) {
    if (element.childNodes.length > 0) {
      for (var i = 0; i < element.childNodes.length; i++)
        this.recurseAdd(element.childNodes[i]);
    }
    if ((element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && pageController.skipElements.indexOf(element.parentNode.nodeName) <= 0) && (element.parentNode.nodeName != 'A' &&  $(element).parents('.text--edit').length === 0)) {
      var completePath = pageModule.getCompletePath(element);
      element.parentNode.className += ' text--edit';
      element.parentNode.setAttribute('data-category', completePath.xpath);
      $('[data-category="' + completePath.xpath + '"]').data('complete-path', completePath);
      element.parentNode.setAttribute('contenteditable', 'true');
      if (element.parentNode.nodeName === 'A') {
        element.parentNode.onclick = function (e) {
          e.preventDefault();
        }
      }
    }
  };

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

  // adds edit class and data to all text nodes
  pageController.addEditClass = function () {
    var body = document.getElementsByTagName('body')[0];
    pageController.recurseAdd(body);
  };

  // removes edit class and data on all text nodes
  pageController.removeEditClass = function () {
    var body = document.getElementsByTagName('body')[0];
    pageController.recurseRemove(body);
  };


  //appends login and and event handler for hiding/showing and authenticating.
  pageController.appendLogin = function () {
    (function () {
      var LoginTemplate = $('<div class="rev_login" style="display: none;"><button class="rev_login_reveal">Revenant</button><div class="rev_login__contaier"><h2>Revenant Login</h2><form class="rev_login__form" method="post" action="submit.data"> <input type="text" title="username" placeholder="username" /><input type="password" title="password" placeholder="password" /><button type="submit" class="btn">Login</button><a class="forgot" href="#">Forgot Username?</a></form></div></div>');
      //TODO: readd template functionality? revenant login and control panel handled with js elements
      // templateModule.getCompiledTemplate('login')
      //     .then(function (html) {
      $('body').prepend(LoginTemplate);
      $('.rev_login_reveal').on('click', function () {
        $('.rev_login__contaier').toggleClass('show');
        pageController.loginAuthenticate();
      })
      // });
    }());
  };

  //appends control panel for user and passes session variable with username to .hbs template
  pageController.appendControlPanel = function () {
    var UserControlPanelTemplate = function (username) {
      return $('<div class="rev_user_control_panel"><h4 class="rev_user">Currently Logged in as: ' + username + '</h4><button class="rev_logout">Logout of Revenant</button></div>')
    };
    //TODO: readd template functionality? revenant login and control panel handled with js elements
    // templateModule.getCompiledTemplate('user_control_panel')
    //     .then(function (html) {
    var rev_auth = JSON.parse(sessionStorage.getItem('rev_auth'));
    var UserControlPanel = UserControlPanelTemplate(rev_auth.username);
    $('body').prepend(UserControlPanel);

    //logout handler
    $('.rev_logout').on('click', function () {
      $('.rev_user_control_panel').remove();
      $('.text--edit').unbind('click', pageController.editHandler);
      pageController.removeEditClass();
      sessionStorage.clear();
      pageController.appendLogin();
    });
    // });
  };


  //authenticates using D8 simple_oauth module parameters. Stores session var with tokens and username, removes login and calls functions for adding edit class and control panel.
  pageController.loginAuthenticate = function () {
    $('.rev_login__form').on('submit', function (e) {
      e.preventDefault();
      var username = $(this).find('input[title="username"]').val(),
        password = $(this).find('input[title="password"]').val(),
        origin = window.location.host;
      var auth_data = {
        "origin": origin,
        "username": username,
        "password": password
      };
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
          pageModule.revenantContentCheck(pageController.init);
          $('.rev_login').remove();
        });
    })
  };

  //control module initializer, checks for session token and adds login or control panel on page load.
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

  return {
    init : pageController.init
  }

})(jQuery);
