var common = require('./common');

exports.getDropboxRequestToken = function(req, res){
  var user_id = req.session.user_id;
  common.dropbox_app.requesttoken(function(status, request_token){
    if( status != 200 ){
      res.render('error', {title: "Error", message: "Problem getting request token from Dropbox.", user_id: user_id});
    }
    else{
    var values = { type: 'dropbox_auth', user_id: user_id, auth_token: request_token.oauth_token, auth_secret: request_token.oauth_token_secret }
      common.connection.query ('INSERT INTO service_informations SET ?', values, function(err, result){
        if( err ){
          res.render('error', {title: "Error", message: "Problem adding oauth_token to database", user_id: user_id});
        }
        else{
          res.redirect("https://www.dropbox.com/1/oauth/authorize?oauth_token=" + request_token.oauth_token + 
                       "&oauth_callback=" + common.http + "/dropbox_access_token" );
        }
      });
    }
  })
};

exports.getDropboxAccessToken = function(req, res){
  var user_id = req.session.user_id;
  
  var uid = req.query.uid;
  var oauth_token = req.query.oauth_token;
  
  if( !uid || !oauth_token ){
    res.render('error', {title: "Error", message: "Needed parameters not received from Dropbox", user_id: user_id});
    return;
  }
  
  // Get request_token from database
  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + 
            " AND type='dropbox_auth' AND auth_token=" + common.connection.escape(oauth_token);
  common.connection.query(sql, function(err1, service_infos){
    if( err1 || service_infos.length != 1){
      res.render('error', {title: "Error", message: "Incorrect oauth_token received from Dropbox.", user_id: user_id});
    }
    else{
      common.dropbox_app.accesstoken({oauth_token_secret: service_infos[0].auth_secret, oauth_token: service_infos[0].auth_token }, function(status, access_token){
        if( status != 200 ){
          console.log(status);
          console.log(access_token);
          res.render('error', {title: "Error", message: "Problem getting access_token from Dropbox.", user_id: user_id});
        }
        else{
          // Remove request token from database, since it is not needed anymore
          sql = "DELETE FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox_auth'";
          common.connection.query(sql, function(err2, rows){
            if( err2 ){
              res.render('error', {title: "Error", message: "Problem removing not needed dropbox_auth info from database", user_id: user_id});
            }
            else{
              // Save auth_token & auth_secret & s_user_id to database (eg. access token)
              var values = {type: "dropbox", user_id: user_id, auth_token: access_token.oauth_token, auth_secret: access_token.oauth_token_secret, s_user_id: uid };
              common.connection.query('INSERT INTO service_informations SET ?', values, function(err3, result){
                if( err3 ){
                  console.log(err3);
                  res.render('error', {title: "Error", message: "Problem adding Dropbox access token to database", user_id: user_id});              
                }
                else{
                  res.redirect('/user');
                }
              });
            }
          });
        }
      });
    }
  });
};

exports.removeDropboxTokens = function(req, res){
  var user_id = req.session.user_id;
  
  var sql = "DELETE FROM service_informations WHERE user_id=" +common.connection.escape(user_id) + " AND ( type='dropbox' OR type='dropbox_auth' )";
  common.connection.query(sql, function(err, result){
    if( err ){
      console.log(err);
      res.render('error', {title: "Error", message: "Error trying to remove dropbox related rows", user_id: user_id});
    }
    else{
      res.status(200).send('ok');
    } 
  });
};

exports.getUserInfo = function(user_id, socket_id){

  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox'";
  common.connection.query(sql, function(err, result){
    if( err || result.length != 1 ){
      //res.render('error', {title: "Error", message: "Error getting dropbox access_token", user_id: user_id});
    }
    else{      
      var client = common.dropbox_app.client( {oauth_token: result[0].auth_token, oauth_token_secret: result[0].auth_secret, uid: result[0].s_user_id} );
      client.account( function(status, reply){
        if( status != 200 ){
          console.log(status);
          console.log(reply);
          //res.render('error', {title: "Error", message: "Error getting user info from Dropbox", user_id: user_id});
        }
        else{
          common.io.sockets.socket(socket_id).emit('dropbox', { type: "userInfo", user_id: user_id, items: reply });
        }
      });
    }    
  });  
};


exports.getDropboxGraphFiles = function(req, res){
  var user_id = req.session.user_id;
  
  var path = '/';
  if( req.query.path ){
    path = req.query.path;
  }
  
  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox'";
  common.connection.query(sql, function(err, result){
    if( err || result.length != 1 ){
      res.render('error', {title: "Error", message: "Error getting dropbox access_token", user_id: user_id});
    }
    else{      
      var client = common.dropbox_app.client( {oauth_token: result[0].auth_token, oauth_token_secret: result[0].auth_secret, uid: result[0].s_user_id, root:'dropbox'} );
      client.metadata(path, function(status, reply){
        if( status != 200 ){
          console.log(status);
          console.log(reply);
          res.render('error', {title: "Error", message: "Error getting file info from Dropbox", user_id: user_id});
        }
        else{
          res.render('dropboxGraph',{title: "Dropbox graph", reply:JSON.stringify(reply), items: reply, user_id: user_id});
        }
      });
    }    
  });  
};


exports.getFolder = function(path, user_id, socket_id){
  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox'";
  common.connection.query(sql, function(err, result){
    if( err || result.length != 1 ){
      //res.render('error', {title: "Error", message: "Error getting dropbox access_token", user_id: user_id});
    }
    else{      
      var client = common.dropbox_app.client({oauth_token: result[0].auth_token, oauth_token_secret: result[0].auth_secret, uid: result[0].s_user_id, root:'dropbox'});
      client.metadata(path, function(status, reply){
      //client.search( '/', 'dvd', function(status, reply){
        if( status != 200 ){
          console.log(status);
          console.log(reply);
          //res.render('error', {title: "Error", message: "Error getting user info from Dropbox", user_id: user_id});
        }
        else{          
          common.io.sockets.socket(socket_id).emit('dropbox', { type: "folder", user_id: user_id, path: path, items: reply });
        }
      });
    }    
  });  
};

exports.getFile = function(path, user_id, socket_id){
  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox'";
  common.connection.query(sql, function(err, result){
    if( err || result.length != 1 ){
      //res.render('error', {title: "Error", message: "Error getting dropbox access_token", user_id: user_id});
    }
    else{ 
      var client = common.dropbox_app.client({oauth_token: result[0].auth_token, oauth_token_secret: result[0].auth_secret, uid: result[0].s_user_id, root:'dropbox'});
      client.media(path, function(status, reply, metadata){
        if( status != 200 ){
          console.log(status);
          console.log(reply);
        }
        else{
          console.log(reply);
          common.io.sockets.socket(socket_id).emit('dropbox', { type: "file", user_id: user_id, url: reply.url });
        }
      });      
    }
  });
};


exports.searchDropboxGraphFiles = function(query, user_id, socket_id){
  var sql = "SELECT * FROM service_informations WHERE user_id=" + common.connection.escape(user_id) + " AND type='dropbox'";
  common.connection.query(sql, function(err, result){
    if( err || result.length != 1 ){
      //res.render('error', {title: "Error", message: "Error getting dropbox access_token", user_id: user_id});
    }
    else{      
      var client = common.dropbox_app.client({oauth_token: result[0].auth_token, oauth_token_secret: result[0].auth_secret, uid: result[0].s_user_id, root:'dropbox'});
      //client.metadata(path, function(status, reply){
      client.search( '/', query, function(status, reply){
        if( status != 200 ){
          console.log(status);
          console.log(reply);
          //res.render('error', {title: "Error", message: "Error getting user info from Dropbox", user_id: user_id});
        }
        else{          
          common.io.sockets.socket(socket_id).emit('dropbox', { type: "search", user_id: user_id, items: reply });
        }
      });
    }    
  });  
};