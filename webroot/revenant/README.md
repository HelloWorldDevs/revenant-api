#Revenant Client Side Scripts

##Explanation and Setup

Revenant contains JS scripts for api interface, template files, basic editor styles, and CKEditor with the Inline Save plugin. 
Revenant is built for editing static sites, and interfaces with the D8 revenenat-api, which manages all saved content. 

To initilaize, all scripts need to be added to the site index. 
 
#### CSS
Append to  `<head>`

 ```
 <link rel="stylesheet" href="revenant/css/main.css"> 
 ```


###JS/CDNs  
Append below all other `<script>` tags

``` 
<script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.5/handlebars.js"></script>
<script src="//cdn.ckeditor.com/4.6.2/standard/ckeditor.js"></script>
<script type="text/javascript" src="revenant/templates/template.js"></script>
<script type="text/javascript" src="revenant/credentials/credentials.js"></script>
<script type="text/javascript" src="revenant/js/page/page.js"></script>
<script type="text/javascript" src="revenant/js/page/pageController.js"></script>
<script>
pageModule.init(pageControllerModule.init);
</script>
```

##Use with revenant-api
User's must have authorized profiles on revenant-api to login and start editing site. 
Login and begin editing content, logout or close page to end session. 

###Add Outh Credentials
Add directory and file `credentials/credentials.js` to revenant root with following code:

```
const OAUTH_CLIENT_ID = "[YOUR_OUTH_CLIENT_UUID]";
const OAUTH_CLIENT_SECRET = "[YOUR_OUTH_CLIENT_SECRET]";
```

Replace `[YOUR_OUTH_CLIENT_UUID]` and `[YOUR_OUTH_CLIENT_UUID]` with client ID and secret after setting up Ouath client on revenant-api. 


