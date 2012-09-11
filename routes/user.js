var common = require('./common');


exports.registerForm = function(req,res){
  var username = req.query.username;
  if( username === undefined){
    username = ""; 
  }
  var firstname = req.query.firstname;
  if( firstname === undefined){
    firstname = ""; 
  }
  var lastname = req.query.lastname;
  if( lastname === undefined){
    lastname = "";
  }
  var email = req.query.email;
  if( email === undefined){
    email = ""; 
  }
  res.render('registerForm', { title: "Register", 
                               username: username, 
                               firstname: firstname, 
                               lastname:lastname, 
                               email: email });
};

exports.register = function(req, res){
  var user_id = req.session.user_id;
  var username = req.body.newusername;
  var firstname = req.body.firstname;
    if( firstname === undefined){
    firstname = ""; 
  }
  var lastname = req.body.lastname;
    if( lastname === undefined){
    lastname = "";
  }
  var password = req.body.newpassword;
  var email = req.body.email;
    if( email === undefined){
    email = ""; 
  }
  if( !username.match(common.letterNumber) ){
    res.render('error', {title: "Error", message: "Username has illegal characters", user_id: user_id});
    return;
  }
  if( username == "" || password == ""){
    res.render('error', {title: "Error", message: "Username/password missing", user_id: user_id});
    return;
  }
  
  var sql = 'SELECT * FROM users WHERE username = ?';
  common.connection.query(sql,[username],function(err, rows){
    if( err ){ 
      console.log(err);
      res.render('error', {title: "Error", message: "The username is already in use.", user_id: user_id});
    }
    else if( rows.length == 0 ){
      // Username was not found, so it can be created
      var values = { username: username, password: password, firstname: firstname, lastname: lastname, email: email }
      common.connection.query ('INSERT INTO users SET ?', values, function(err, result){
        if( err ){
          console.log(err);
          res.render('error', {title: "Error", message: "Could not add the user to database.", user_id: user_id});            
        }
        else{
          console.log('Created user: ' + username );
          res.render('register', {title: "User creation", 
                                  message: "Created user: " + username + ".", 
                                  success: true,
                                  username: username, 
                                  user_id: user_id });        
        }
      });
    }
  });
};

exports.getUser = function(req, res){
  var user_id = req.session.user_id;
  var sql = 'SELECT * FROM users WHERE id = ' + common.connection.escape(user_id);
  common.connection.query(sql, function(err, rows){
    if( err ){
      console.log(err);
      res.render('error', {title: "Error", message: "The requested user id '" + user_id + "' was not found.", user_id: user_id});
    }
    else if( rows.length != 1 ){
      console.log("A user was not found");
      res.render('error', {title: "Error", message: "The requested user id '" + user_id + "' was not found.", user_id: user_id});
    }
    else{
      console.log(rows);
      var sql = 'SELECT * FROM service_informations WHERE user_id = ' + common.connection.escape(user_id) + ' AND type = "dropbox"';
      common.connection.query(sql, function(err, dropbox_rows){
        if( err || dropbox_rows.length > 1 ){
          res.render('error', {title: "Error", message: "Problem looking for dropbox-auth..", user_id: user_id});
        }
        else if( dropbox_rows.length != 1 ){
          res.render('showUser', {title: "Show user: " + rows[0].username,
                                  username: rows[0].username,
                                  firstname: rows[0].firstname,
                                  lastname: rows[0].lastname,
                                  email: rows[0].email,
                                  dropbox_linked: false,
                                  user_id: user_id});               
        }
        else{
          res.render('showUser', {title: "Show user: " + rows[0].username,
                                  username: rows[0].username,
                                  firstname: rows[0].firstname,
                                  lastname: rows[0].lastname,
                                  email: rows[0].email,
                                  dropbox_linked: true,
                                  dropbox_row: dropbox_rows[0],
                                  user_id: user_id});
        }
      });          
    }   
  });
};

exports.modifyUser = function(req, res){
  var user_id = req.session.user_id;
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var password = req.body.password;
  var email = req.body.email;
  
  // Save to database
  sql = "UPDATE users SET firstname=" + common.connection.escape(firstname) + 
                       ", lastname=" + common.connection.escape(lastname) + 
                       ", email=" + common.connection.escape(email);
  if( password != "" ){
    sql += ", password=" + common.connection.escape(password);
  }
  
  sql += " WHERE id=" + user_id;
     console.log(sql);                  
  common.connection.query(sql, function(err, result){
    if( err ){
      console.log(err)
      res.render('error', {title: "Error", message: "Problem updating user info to database", user_id: user_id});
    }
    else{
      res.render('showUser', {title: "Show user: " + username,
                              username: username,
                              firstname: firstname,
                              lastname: lastname,
                              email: email, 
                              user_id: user_id});
    }
  });
};

exports.deleteUser = function(req, res){
  var user_id = req.session.user_id;
  var sql = 'SELECT * FROM users WHERE id = ' + common.connection.escape(user_id);
  common.connection.query(sql, function(err, rows){
    if( err ){
      console.log(err);
      res.render('error', {title: "Error", message: "The requested user id '" + user_id + "' was not found.", user_id: user_id});
    }
    else if( rows.length != 1){
      res.render('error', {title: "Error", message: "The requested user id '" + user_id + "' was not found.", user_id: user_id});
    }
    else{
      sql = 'DELETE from users WHERE id = ' + common.connection.escape(user_id);
      common.connection.query(sql, function(err, result){
        if( err ){
          console.log(err);
          res.render('error', {title: "Error", message: "The requested user id '" + user_id + "' was not found.", user_id: user_id});
        }
        else{
          sql = 'DELETE from service_informations WHERE user_id=' + common.connection.escape(user_id)
          common.connection.query(sql, function(err, result){
            if( err ){
              console.log(err);
              res.render('error', {title: "Error", message: "User delted, problem removing service_informations for the user", user_id: user_id});
            }
            else{
              res.render('home', {title: "Home", message: "User '" + user_id + "' removed from the system.", user_id: user_id});
            }
          });
        }
      });
    }
  });
};