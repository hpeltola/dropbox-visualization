/* 
 * Force graph for viewing items
 */

// Initialize the view
var w = 800,
    h = 500;

var force = d3.layout.force()
    .gravity(1)
    .charge(-6000)
    .size([w, h])
    .linkDistance(75)
    .linkStrength(function(x) { return x.weight * 2 })
    .friction(0.3);

var nodes = force.nodes(),
    links = force.links();
    
var vis = d3.select("body").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

// Move the items on each 'tick', according to forces    
force.on("tick", function() {
  vis.selectAll("g.node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  vis.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });         
});

// Reload all items
function restart() {
  var link = vis.selectAll("line.link")
      .data(links, function(d) { return d.source.id + "-" + d.target.id; });

  link.enter().insert("svg:line", "g.node")
      .attr("class", "link");

  link.exit().remove();

  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id;});
        
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .call(force.drag);
                
  nodeEnter.append("svg:image")
      .attr("class", "circle")
      .attr("xlink:href", function(d){ return d.thumb})
      .attr("x", "-8px")
      .attr("y", "-8px")
      .attr("width", "16px")
      .attr("height", "16px");
      
      nodeEnter.append("svg:text")
      .attr("class", "nodetext")
      .attr("dx", 12)
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.label });
      
  node.exit().remove();
                
  force.start();
  
  vis.selectAll("g.node").on("click", function(d){
    if( d.link == "users"){
      document.getElementById("path").innerHTML = "<b>Path:</b> /";
      GetUsers();
    }
    else if( d.link == "devices" ){
      current_user = d.label;
      current_user_thumb = base_url + "/user/"+current_user+"/metadatas/thumbnail";

      document.getElementById("path").innerHTML = "<b>Path:</b> /user/"+current_user;
      GetUserDevices(current_user);
    } 
    else if( d.link == "files"){
      current_user = d.username;
      current_device = d.devicename;
      current_dev_thumb = d.thumb;
      document.getElementById("path").innerHTML = "<b>Path:</b> /user/"+current_user+"/device/"+d.devicename;
      if( d.opened == "true" ){
        HideDevice(d.username, d.devicename);
        d.opened = "false";
      }
      else{
        d.opened = "true";
        GetFilesForDeviceInGroup(d.username, d.devicename);
      }
//      GetDeviceFiles(current_user, d.devicename);

    }
    else if( d.link == "groupDeviceFiles" ){
      if( d.opened == "true" ){
        HideDevice(d.username, d.devicename);
        d.opened = "false";
      } 
      else {
        d.opened = "true";        
        current_user = d.username;
        current_device = d.devicename;
        GetFilesForDeviceInGroup(d.username, d.devicename);
      }
    }
    else if( d.link == "file"){
      var tmpPath = d.link_file.slice(d.link_file.indexOf("/user/"));

      var params = authParams(tmpPath);
      window.open(d.link_file+"?auth_hash=" + params.auth_hash +
                               "&auth_timestamp=" + params.auth_timestamp +
                               "&auth_username=" + params.auth_username +
                               "&i_am_client=true"  , '_new_tab');
      }
    });
}

var HideDevice = function(username, devicename){
  var node;
  for( var i in nodes){
    if( nodes[i].username == username && nodes[i].devicename == devicename && nodes[i].type == "device" ){
      node = nodes[i];
    }
  }
  var j = 0;
  while( j < links.length)
  {
    if( links[j].source.index == node.index )
    {
      nodes.splice(links[j].target.index, 1); 
      links.splice(j,1);
      restart();
    }
    else{
      j++;
    }
  }
}


// FUNCTIONS FOR GETTING INFORMATION FROM VISUALREST
var GetUsers = function(){
  
  var path = "/users";
  var params = {};
  params = authParams(path);
  params["user"] = "";
  params["qoption[format]"] = "json";

  $.ajax({
    url: base_url + path, 
    data: params, 
    dataType: 'jsonp',
    jsonp: "qoption[json_callback]",
    jsonpCallback: 'handleUsers',
    error: function(){alert("Problem getting users list")}
  });
}

var GetUserDevices = function(username){

  var path = "/user/" + username + "/devices";
  var params = {};
  params = authParams(path);
  params["qoption[format]"] = "json";

  $.ajax({
    url: base_url + path, 
    data: params, 
    dataType: 'jsonp',
    jsonp: "qoption[json_callback]",
    jsonpCallback: 'handleDevices',
    error: function(){alert("This user does not have any devices!")}
  });
}

var GetDeviceFiles = function(username, devicename){

  var path = "/user/" + username + "/device/" + devicename + "/files";
  var params = {};
  params = authParams(path);
  params["qoption[format]"] = "json";

  $.ajax({
    url: base_url + path, 
    data: params, 
    dataType: 'jsonp',
    jsonp: "qoption[json_callback]",
    jsonpCallback: 'handleDeviceFiles',
    error: function(){alert("Problem getting device files")}
  });
}

var GetGroup = function(user, group){

  var path = "/user/" + user + "/group/" + group
  var params = {};
  params = authParams(path);
  params["qoption[format]"] = "json";

  document.getElementById("path").innerHTML = "<b>Path:</b> /user/" + user + "/group/" + group;

  $.ajax({
    url: base_url + path, 
    data: params, 
    dataType: 'jsonp',
    jsonp: "qoption[json_callback]",
    jsonpCallback: 'handleGroupInfo',
    error: function(){alert("Problem getting group info")}
  });

}

var GetFilesForDeviceInGroup = function(username, devicename){

  var path = "/user/" + username + "/device/" + devicename + "/files";
  var params = {};
  params = authParams(path);
  params["qoption[format]"] = "json";

  $.ajax({
    url: base_url + path, 
    data: params, 
    dataType: 'jsonp',
    jsonp: "qoption[json_callback]",
    jsonpCallback: 'handleFilesForDeviceInGroup',
    error: function(){alert("Problem getting device files for a group")}
  });
}

handleFilesForDeviceInGroup = function(data){
  
  var node;
  var index;
  // Create the center node
  for( var i in nodes){
    if( nodes[i]["username"] == current_user && nodes[i]["devicename"] == current_device && nodes[i]["type"] == "device")
    {
      nodes[i]["weight"] += 2;
      node = nodes[i];
    }
  }
  var source = node.index;
    
  // Create all file nodes
  for( var i in data ){
    if( data.hasOwnProperty(i) ){
      for( var j in data[i]){
        if( data[i].hasOwnProperty(j) ){
          node = {
            label : data[i][j].filename,
            link : "file",
            username : data[i][j].file_user,
            devicename : data[i][j].file_device,
            link_file : data[i][j].essence_uri,
            thumb : data[i][j].thumbnail,
            type : "file"
          };
          var target = nodes.length;
          nodes.push(node);
          
          links.push({
            source: source,
            target : target,
            weight : 3
          });
        }
      }
    }   
  }

  restart();
}

handleGroupInfo = function(data){
  nodes.splice(0,nodes.length);
  links.splice(0,links.length);

  // Create the center node
  var node = { link: "users", thumb: "./img/user-group-2.png" };
  nodes.push(node);

  // Create all file nodes
  for( var i in data["files"] ){
    if( data["files"].hasOwnProperty(i) ){

      node = {
        label : data["files"][i].filename,
        link : "file",
        username : data["files"][i].username,
        devicename : data["files"][i].devicename,
        link_file : data["files"][i].essence_uri,
        thumb : data["files"][i].thumbnail,
        type : "file"
      };
      nodes.push(node);
    }   
  }

  // Create device nodes
  for( var i in data["devices"] ){
    if( data["devices"].hasOwnProperty(i) ){
      
      node = {
        label : data["devices"][i].username + " / " + data["devices"][i].devicename,
        link : "groupDeviceFiles",
        username : data["devices"][i].username,
        devicename : data["devices"][i].devicename,
        thumb : "./img/Computer-icon.png",
        type : "device"
      };
      nodes.push(node);
    }   
  }

  for(var i = 1; i < nodes.length; i++) {
  // Create links between center node and all other
    links.push({
      source : 0,
      target : i,
      weight : 1
    });
  };
  
  restart();
}

handleDeviceFiles = function(data){
  nodes.splice(0,nodes.length);
  links.splice(0,links.length);

  // Create the center node
  var node = { link: "devices", label: current_user, thumb: current_dev_thumb};
  nodes.push(node);
    
  // Create all file nodes
  for( var i in data ){
    if( data.hasOwnProperty(i) ){
      for( var j in data[i]){
        if( data[i].hasOwnProperty(j) ){
          node = {
            label : data[i][j].filename,
            link : "file",
            username : data[i][j].file_user,
            devicename : data[i][j].file_device,
            link_file : data[i][j].essence_uri,
            thumb : data[i][j].thumbnail,
            type : "file"
          };
          nodes.push(node);
        }
      }
    }   
  }

  for(var i = 1; i < nodes.length; i++) {
  // Create links between center node and all other
    links.push({
      source : 0,
      target : i,
      weight : 1
    });
  }
  
  restart();
}

handleDevices = function(data){

  
  nodes.splice(0,nodes.length);
  links.splice(0,links.length);


  // Create the center node
  var node = { link: "users", thumb: current_user_thumb };
  nodes.push(node);
    
  // Create all device nodes
  for( var i in data ){
    if( data.hasOwnProperty(i) ){
      if( data[i].hasOwnProperty("device_name") ){
        // Thumbnail icon   
        var thumb = "./img/server-icon.png";
        if( data[i].device_type == "virtual_container") {
          thumb = "./img/Database.png"
        } else if( data[i].device_type == "x86_64-linux___" ) {
          thumb = "./img/Computer-icon.png"
        } else if( data[i].device_type == "android" || data[i].device_type == "Nokia-N900" ) {
          thumb = "./img/Smartphone-icon.png"
        } else if( data[i].device_type == "arm-linux___" ) {
          thumb = "./img/PDA-icon.png"
        }

        node = {
          label : data[i].device_name,
          link : "files",
          username : data[i].owner_name,
          devicename : data[i].device_name,              
          thumb : thumb,
          type : "device"
        };
        nodes.push(node);
      }
    }   
  }

  for(var i = 1; i < nodes.length; i++) {
  // Create links between center node and all other
    links.push({
      source : 0,
      target : i,
      weight : 1
    });
   
  };
  
  restart();
}

handleUsers = function(data){
  
  nodes.splice(0,nodes.length);
  links.splice(0,links.length);
    
  current_user = null;
  current_user_thumb = null;
  current_dev_thumb = null;

  // Create the center node
  var node = { thumb: "./img/user-group-2.png", label: "" };
  nodes.push(node);
  
  // Create all user nodes
  for( var i in data ){
    if( data.hasOwnProperty(i) ){
      if( data[i].hasOwnProperty("username") ){     
        node = { label : data[i].username,
                  id : data[i].username,
                  link : "devices",
                  thumb : data[i].thumbnail_uri,
                  type : "user"
        };
        nodes.push(node);
      }
    }   
  }

  for(var i = 1; i < nodes.length; i++) {
    // Create links between center node and all other
    links.push({ source : 0,
                  target : i,
                  weight : 1
    });
    
  };
  restart();
}

Login = function(){

  var user = $("#Username");
  var pass = $("#Password");

  if ( user[0].value.length != 0 && pass[0].value.length != 0 ){
    username = user[0].value;
                password = pass[0].value;
   
    var path = "/authenticateUser";     

    var params = {};
    params = authParams(path);
    params["access-control-allow-origin"] = "true";

    $.ajax({
                  url: base_url + path, 
                  data: params,
      success: function(){
        document.getElementById("login").style.display = 'none';
        document.getElementById("logged_in").style.display = 'show';
        document.getElementById("logged_username").innerHTML = "Logged in as: " + username;         
        // Get groups the user is in
        UserGroups();
      },
      error: function(){alert("Error authenticating the user")}
    });
  }
  else{
    alert("Username/password missing");
  }

}

var UserGroups = function(){

  var path = "/user/" + username;
  var params = {};
  params = authParams(path);
  params["qoption[format]"] = "json";

  $.ajax({
          url: base_url + path, 
          data: params, 
          dataType: 'jsonp',
        jsonp: "qoption[json_callback]",
          jsonpCallback: 'handleGroups',
    error: function(){alert("This user does not have any devices!")}
  });
}

var handleGroups = function(data){
  document.getElementById("user_own_groups").innerHTML = "Own groups:<br />";
  document.getElementById("user_member_in_groups").innerHTML = "Member in groups:<br />";
  document.getElementById("users_in_same_group").innerHTML = "Users in same groups with :<br />";
  for( var i in data ){
    if( data.hasOwnProperty(i) ){
      // Users own groups
      for( var j in data[i]["own_groups"] ){
        var groupname = data[i]["own_groups"][j]["name"];
        var button = document.createElement("button");
        button.innerHTML = groupname;
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "GetGroup('"+username+"','"+groupname+"' )");
        document.getElementById("user_own_groups").appendChild(button);
        document.getElementById("user_own_groups").innerHTML += "<br />";
      }
      if( data[i]["own_groups"].length == 0){
        document.getElementById("user_own_groups").innerHTML += "<br />";
      }

      // Member in groups
      for( var j in data[i]["member_in_groups"] ){
        var groupname = data[i]["member_in_groups"][j]["name"];
        var ownername = data[i]["member_in_groups"][j]["owner_name"];
        var button = document.createElement("button");
        button.innerHTML = groupname;
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "GetGroup('"+ownername+"','"+groupname+"' )");
        document.getElementById("user_member_in_groups").appendChild(button);
        document.getElementById("user_member_in_groups").innerHTML += "<br />";
      }
      if( data[i]["member_in_groups"].length == 0){
        document.getElementById("user_member_in_groups").innerHTML += "<br />";
      }

      // Users in same groups
      for( var j in data[i]["users_in_same_groups_with_you"] ){
        var usrname = data[i]["users_in_same_groups_with_you"][j];
        var button = document.createElement("button");
        button.innerHTML = usrname;
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "GetUserDevices('"+usrname+"' )");
        document.getElementById("users_in_same_group").appendChild(button);
        document.getElementById("users_in_same_group").innerHTML += "<br />";
        
      }

    }
  }
}



// If enter is pressed, make query
function checkEnterMakeQuery(e){
   if (e.keyCode == 13){
        Login();
    }
}

// Create authentication parameters based on: username, password, path
authParams = function(path){
  var params = {};

  if( username && password ){
    params.i_am_client = "true";
    params.auth_username = username;
    params.auth_timestamp = new Date().getTime();
    params.auth_hash = Crypto.SHA1(params.auth_timestamp+password+path);
  }

  return params
}

var base_url = "http://visualrest.cs.tut.fi";
var current_user;
var current_device;
var current_user_thumb;
var current_dev_thumb;
var username;
var password;

GetUsers();