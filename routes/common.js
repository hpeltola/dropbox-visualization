var mysql = require('mysql');

exports.http = "http://localhost:5000";

exports.connection = mysql.createConnection({ 
  host: 'localhost', 
  user: 'test',
  password: 'test',
  database: 'dropbox_visual'
});

exports.setIO = function(socket){
  exports.io = socket;
};

exports.letterNumber = /^[0-9a-zA-ZöäåÖÄÅ]+$/;
exports.letterNumberSpace = /^[0-9a-zA-ZöäåÖÄÅ ]+$/;

var dropbox_app_key = "";
var dropbox_app_secret = "";


var dbox  = require('dbox');
exports.dropbox_app = dbox.app({ "app_key": dropbox_app_key, "app_secret": dropbox_app_secret })