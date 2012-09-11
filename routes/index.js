var mysql = require('mysql');

var user = require('./user');
var dropbox = require('./dropbox');

var common = require('./common');

// Setup websockets
exports.setIO = common.setIO;
exports.setIOConnection = function(){
  common.io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });

    socket.on('dropbox', function(data){
      if( data.action == "getFolder" ){
         dropbox.getFolder(data.path, data.user_id, socket.id);
      }
      else if( data.action == "getUserInfo" ){
        dropbox.getUserInfo(data.user_id, socket.id);
      }
      else if( data.action == "getFile" ){
        dropbox.getFile(data.path, data.user_id, socket.id);
      }
      else if( data.action == "searchFiles" ){
        console.log(data);
        dropbox.searchDropboxGraphFiles(data.query, data.user_id, socket.id );
      }
    });        
  });
}


// User functions
exports.registerForm = user.registerForm;
exports.register = user.register;
exports.getUser = user.getUser;
exports.modifyUser = user.modifyUser;
exports.deleteUser = user.deleteUser;

// Dropbox
exports.getDropboxRequestToken = dropbox.getDropboxRequestToken;
exports.getDropboxAccessToken = dropbox.getDropboxAccessToken;
exports.removeDropboxTokens = dropbox.removeDropboxTokens;
exports.getDropboxGraphFiles = dropbox.getDropboxGraphFiles;


exports.login = function(req,res){

  var post = req.body;
  var sql = 'SELECT * FROM users WHERE username = ? && password = ?';
  common.connection.query(sql,[post.username, post.password],function(err, rows){
    if( err ){
      console.log(err);
      res.render('error', {title: "Error", message: 'Bad username/password'});
    }
    else if( rows.length != 1 ){
      res.render('error', {title: "Error", message: 'Bad username/password'});
    }
    else{
      console.log("Logged in user: " + rows[0].username);
      req.session.user_id = rows[0].id;
      req.session.username = rows[0].username;
      req.session.firstname = rows[0].firstname;
      req.session.lastname = rows[0].lastname;
      req.session.email = rows[0].email;
      res.redirect('/');
    }
  });
};

exports.logout = function(req, res){
  delete req.session.user_id;
  res.redirect('/');
};


exports.home = function(req,res){
  
  var user_id = req.session.user_id;
  res.render('home', { title: "Home", user_id: user_id });
};


exports.checkAuth = function(req, res, next) {
  if (!req.session.user_id) {
    res.render('error', {title: "Error", message: 'You are not authorized to view this page', user: null});
  } else {
    var auth_username = req.session.username;
    var auth_user_id = req.session.user_id;
    next();
  }
}