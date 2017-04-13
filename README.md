#Revenant and Revenant API

##Explanation and Setup
Revenant API is a Drupal 8 site, hosting custom javascript for front end content management. All content is stored in the Drupal DB and configured as custom content types.  

##Install and Setup
- git clone
- create local db & user
- in settings.php or settings.local.php include `$config_directories['staging'] = '../config/staging';`
- import configuration from production with `drush config-import staging` 
- `cd webroot/revenant && npm install`

The revenant-api uses oauth to allow users to login and update content, via the revenant client javascript. OAth credentials are stored in the revenant_page api module in a yml config file, and should be distributed by administrators as they are not included in git. 

##Development
When working with revenant scripts and updating front end functionality, run `npm start` from 'webroot/revenant'

##Configuring With Front End Client

####CORS
Any site that is going to use revenant API services must be included in the sites services.yml allowedOrigins. 

Client credentials are created using the Simple OAth module, and must be stored in the correct location for client requests to access. 

###Users
User's must have authorized profiles on revenant-api to login and start editing site. 
Login and begin editing content, logout or close page to end session. 
 
 ###Revenant scripts
To initilaize, the following script needs to be added to the page that will be edited.  
 
```html  
<script type="text/javascript" src="http://revenant-api.bfdig.com/revenant/dist/revenant.min.js"></script>
```

The client should be able to show revenant login from using `CTRL + OPT + R`, and login with their username and password. 

Happy coding Joe ;) 
