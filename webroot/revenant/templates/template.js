var templateModule = (function(module){
    function getCompiledTemplate(name){
        console.log('inside of getCompiledTemplate');
        return $.ajax({
            type: 'GET',
            url: 'http://revenant-api.bfdig.com/revenant/templates/' + name + '.hbs'
        })
            .then(function(text) {
                return Handlebars.compile(text);
            });
    }
    return {
        getCompiledTemplate : getCompiledTemplate
    }
})();

// 'http://' + RevenantAPIServer +


// var LoginTemplate = $('<div class="rev_login"><button class="rev_login_reveal">Revenant</button><div class="rev_login__contaier"><h2>Revenant Login</h2><form class="rev_login__form"> <input type="text" title="username" placeholder="username" /><input type="password" title="password" placeholder="password" /><button type="submit" class="btn">Login</button><a class="forgot" href="#">Forgot Username?</a></form></div></div>');
//
// var UserControlPanelTemplate = function(username) {
//     return $('<div class="rev_user_control_panel"><h4 class="rev_user">Currently Logged in as: '+ username+ '</h4><button class="rev_logout">Logout of Revenant</button></div>')
// }