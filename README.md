# D8 revenant-api
Drupal revenant-api for managing edited client side content. Hosted on Webfaction.

##Setup
- clone repo and configure local Drupal setup (setup database, copy example.settings.php to settings.local.php). 
- copy default.services.yml to services.yml and setup opt in CORS support `https://www.drupal.org/node/2715637` to accept origins and requests from urls sending/recieving edited text data. 
- copy code `$config_directories['staging'] = '../config/staging';` into settings.php or settings.local.php
- config with `drush config-import staging` and run `drush cr`



# revenant Client Side Scripts

##Explanation and Setup

Revenant contains JS scripts for api interface, template files, basic editor styles, and CKEditor with the Inline Save plugin. 
Revenant is built for editing static sites, and interfaces with the D8 revenenat-api, which manages all saved content. 

To initilaize, all scripts need to be added to the site index. 
 
#### CSS
Append to  `<head>`

 ```
 <link rel="stylesheet" href="http://revenant-api.bfdig.com/revenant/css/main.css"> 
 ```

###JS/CDN  
Append below all other `<script>` tags

``` 
<script src="//cdn.ckeditor.com/4.6.2/standard/ckeditor.js"></script>
<script type="text/javascript" src="http://revenant-api.bfdig.com/revenant/js/page/page.js"></script>
```
