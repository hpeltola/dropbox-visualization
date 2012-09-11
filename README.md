## Dropbox visualization

## Initialization

### Dropbox app_key & app_secret

In Dropbox developer (https://www.dropbox.com/developers), an app must be created.
'App_key', and 'app_secret' must be set in /routes/common.js

### Database and tables must be created

CREATE DATABASE dropbox_visual;

CREATE TABLE users( id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), firstname VARCHAR(255), lastname VARCHAR(255), email VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE service_informations( id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, type VARCHAR(255), user_id INT, auth_token VARCHAR(255), auth_secret VARCHAR(255), s_username VARCHAR(255), s_user_id VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

