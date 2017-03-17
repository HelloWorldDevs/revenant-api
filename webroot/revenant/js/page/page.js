var pageModule = (function ($) {
    var page = {};

    const DEV_CONFIGS = {
        'LOCAL': 'http://revenant-test.dev/',
        'PROD':  'http://revenant-api.bfdig.com/'
    }

        page.getText = function (e) {
        var text = e.parentNode.textContent;
        return text;
    };

    page.getElementByXpath = function (path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };

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
            // xhrFields: {
            //     withCredentials: true
            // },
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
                console.log("revenant content check error: " + err);
            }
        });
    };

    page.conigureEnv = function(opt) {
        DEV_CONFIG = DEV_CONFIGS[opt]
    }

    page.addCKEditor = function() {
        return $.ajax({
            url: DEV_CONFIG + 'revenant/ckeditor/ckeditor.js',
            dataType: 'script',
            cache: true
        });
    };

    page.addSpinJS = function() {
        return $.ajax({
            url: DEV_CONFIG + 'revenant/spin/spin.min.js',
            dataType: 'script',
            cache: true
        });
    };

    page.spinnerLoad = function() {
        $spinnerDiv = $('<div id="loading-spinner"><div>')
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


    //initializes check for content and passes in pageController as callback
    page.init = function (opt, callback) {
        page.conigureEnv(opt);
        page.addSpinJS().done(function() {
            console.log('added spinnerjs');
            page.spinnerLoad();
        });
        page.addCKEditor().done(function () {
            page.revenantContentCheck(callback);
        });
    };

    var pageController = {};

    pageController.ckEditorInit = function () {
        //ckeditor inline save plugin configuration.
        CKEDITOR.plugins.addExternal('inlinesave', DEV_CONFIG + 'revenant/ckeditor/plugins/inlinesave/', 'plugin.js');
        CKEDITOR.disableAutoInline = true;
        CKEDITOR.dtd.$editable = {a: 1, address: 1, article: 1, aside: 1, blockquote: 1, body: 1, details: 1, div: 1, fieldset: 1, figcaption: 1, footer: 1, form: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, header: 1, hgroup: 1, main: 1, nav: 1, p: 1, pre: 1, section: 1};

        //for clearing ckeditor cache and allowing set Authorization Header
        // CKEDITOR.timestamp = 'ABCD';
    };


//inline editor added on text element click
    pageController.edit = function () {
        $('.text--edit').on('click', function () {
            var dataCategory = $(this).attr('data-category');
            var data = $(this).data('complete-path');
            data.username = JSON.parse(sessionStorage.getItem('rev_auth')).username;
            var authBearer = 'Bearer ' + JSON.parse(sessionStorage.getItem('rev_auth')).access_token;
            // console.log('data here!', data);
            var el = document.querySelector('[data-category="' + dataCategory + '"');
            if (!el.hasAttribute('id', data.xpath)) {
                el.setAttribute('id', data.xpath);
                CKEDITOR.config.inlinesave = {
                    postUrl: DEV_CONFIG + 'revenant_page/page_content',
                    postAuth: authBearer,
                    postData: {data: data},
                    useJson: true,
                    onSave: function (editor) {
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
                CKEDITOR.inline(el, {
                    bodyId: data,
                    title: 'test title',
                    extraPlugins: 'inlinesave',
                    allowedContent: true,
                });
            }
        });
    };

    // adds edit class and data to all text nodes
    pageController.addEditClass = function () {
        var body = document.getElementsByTagName('body')[0];

        function recurseAdd(element) {
            if (element.childNodes.length > 0) {
                for (var i = 0; i < element.childNodes.length; i++)
                    recurseAdd(element.childNodes[i]);
            }
            if (element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && element.parentNode.nodeName != 'SCRIPT' && element.parentNode.nodeName != 'NOSCRIPT') {
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
        }
        recurseAdd(body);
    };

    // removes edit class and data on all text nodes
    pageController.removeEditClass = function () {
        var body = document.getElementsByTagName('body')[0];

        function recurseRemove(element) {
            if (element.childNodes.length > 0) {
                for (var i = 0; i < element.childNodes.length; i++)
                    recurseRemove(element.childNodes[i]);
            }
            if (element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '' && element.parentNode.nodeName != 'SCRIPT' && element.parentNode.nodeName != 'NOSCRIPT') {
                var completePath = pageModule.getCompletePath(element);
                element.parentNode.classList.remove("text--edit");
                $('[data-category="' + completePath.xpath + '"]').removeData('complete-path');
                element.parentNode.removeAttribute('data-category');
                element.parentNode.removeAttribute('contenteditable');
                if (element.parentNode.nodeName === 'A') {
                    element.parentNode.onclick = null;
                }
            }
        }
        recurseRemove(body);
    };

//

    //appends login and and event handler for hiding/showing and authenticating.
    pageController.appendLogin = function () {
        (function () {
            var LoginTemplate = $('<div class="rev_login"><button class="rev_login_reveal">Revenant</button><div class="rev_login__contaier"><h2>Revenant Login</h2><form class="rev_login__form" method="post" action="submit.data"> <input type="text" title="username" placeholder="username" /><input type="password" title="password" placeholder="password" /><button type="submit" class="btn">Login</button><a class="forgot" href="#">Forgot Username?</a></form></div></div>');
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
        // templateModule.getCompiledTemplate('user_control_panel')
        //     .then(function (html) {
        var rev_auth = JSON.parse(sessionStorage.getItem('rev_auth'));
        var UserControlPanel = UserControlPanelTemplate(rev_auth.username);
        $('body').prepend(UserControlPanel);
        $('.rev_logout').on('click', function () {
            $('.rev_user_control_panel').remove();
            pageController.removeEditClass();
            sessionStorage.clear();
            pageController.init();
        });
        // });
    };


    //authenticates using D8 simple_oauth module parameters. Stores session var with tokens and username, removes login and calls functions for adding edit class and control panel.
    pageController.loginAuthenticate = function () {
        $('.rev_login__form').on('submit', function (e) {
            e.preventDefault();
            var username = $(this).find('input[title="username"]').val(),
                password = $(this).find('input[title="password"]').val(),
                //for back end yaml file naming convention
                origin = window.location.host.replace(/\./g, '-').replace(/\//g, '-');
            auth_data = {
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
                    pageModule.init();
                    $('.rev_login').remove();
                    pageController.addEditClass();
                    pageController.edit();
                    pageController.appendControlPanel();
                });
        })
    };

    //control module initializer, checks for session token and adds login or control panel on page load.
    pageController.init = function () {
        pageController.ckEditorInit();
        if (!sessionStorage.getItem('rev_auth')) {
            pageController.appendLogin();
        } else {
            pageController.addEditClass();
            pageController.edit();
            pageController.appendControlPanel();
        }
    };


    return {
        pageControllerInit: pageController.init,
        getCompletePath: page.getCompletePath,
        init: page.init,
    }

})(jQuery);

pageModule.init('LOCAL', pageModule.pageControllerInit);