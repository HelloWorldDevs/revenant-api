var pageModule = (function ($) {
    var page = {};

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
        // console.log('inside create page, current revenant', currentPage);
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
            success: function (data) {
                // console.log('create page post success', data)
            },
            error: function (err) {
                // console.log("create page post error: " + err);
            }
        });
    };

    ///check for revenant content for current page, appends all content and invokes pageController callback.
    page.revenantContentCheck = function (callback) {
        const pageLocation = window.location.hostname + window.location.pathname;
        $.ajax({
            method: 'GET',
            url: 'http://revenant-api.bfdig.com/rev-content/?url=' + pageLocation,
            success: function (data) {
                // console.log('success agaaaaaaain!', data);
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
                console.log("AJAX error in request: " + err);
            }
        });
    };

    page.addCKEditor = function (callack) {
        return $.ajax({
            url: 'http://revenant-api.bfdig.com/revenant/ckeditor/ckeditor.js',
            dataType: 'script',
            cache: true
        });
    };


    //initializes check for content and passes in pageController as callback
    page.init = function (callback) {
        page.addCKEditor().done(function () {
            page.revenantContentCheck(callback);
        });
    };

    var pageController = {};

    pageController.ckEditorInit = function () {
        //ckeditor inline save plugin configuration.
        CKEDITOR.plugins.addExternal('inlinesave', 'http://revenant-api.bfdig.com/revenant/ckeditor/plugins/inlinesave/', 'plugin.js');
        CKEDITOR.disableAutoInline = true;

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
                    postUrl: 'http://revenant-api.bfdig.com/revenant_page/page_content',
                    postAuth: authBearer,
                    postData: {data: data},
                    useJson: true,
                    onSave: function (editor) {
                        return true;
                    },
                    onSuccess: function (editor, data) {
                        // console.log('save successful', editor, data);
                    },
                    onFailure: function (editor, status, request) {
                        // console.log('save failed', editor, status, request);
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
            $.post("http://revenant-api.bfdig.com/revenant_page/page_auth", JSON.stringify(auth_data))
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

pageModule.init(pageModule.pageControllerInit);