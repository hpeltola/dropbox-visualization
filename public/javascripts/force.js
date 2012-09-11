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
    .linkDistance(100)
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
    if( d.type == "folder"){
      getDropboxFolder(d.path);
    }
    else if( d.type == "file" ){
      getDropboxFile(d.path);
    }
    else if( d.type == "root" ){
      getDropboxUserInfo();
    }
    else if( d.type == "center" ){
      getDropboxFolder(d.path.slice(0, d.path.lastIndexOf('/')  ) );
    }
  });
}

var showDropboxItemsInGraph = function(reply){

  var data = jQuery.parseJSON(reply);

  $('div#path').html('<b>Path: </b>' + data.path);

  nodes.splice(0,nodes.length);
  links.splice(0,links.length);

  if( !data.is_dir ){
    return;
  }

  // Create the center node
  var node = { thumb: "../img/folder.png",
               label: "",
               path: data.path };

  if( data.path == "/" ){
    node.type = "root";
    node.id = "root"+data.path;
  }
  else{
    node.type = "center";
    node.id = "center"+data.path;
  }
  
  nodes.push(node);
  
  var items = data.contents

  // Create all nodes
  for( var i in items ){
    var item = items[i];
    node = { label : item.path.substring( item.path.lastIndexOf('/')+1 ),
                id : item.path,
                path: item.path };
                
    if( item.is_dir ){
      node.thumb = "../img/folder.png";
      node.type = "folder";     
    }
    else{
      node.thumb = "../img/file.png";
      node.type = "file";          
    }

    nodes.push(node);
  }

  for(var i = 1; i < nodes.length; i++) {
    // Create links between center node and all other
    links.push({ source : 0,
                  target : i,
                  weight : 1
    });
    
  };
  restart();  
};


var showDropboxSearchResultsInGraph = function(reply){

  var data = jQuery.parseJSON(reply);

  $('div#path').html('<b>Path: </b> Search results' );

  nodes.splice(0,nodes.length);
  links.splice(0,links.length);

  var node = { thumb: "../img/folder.png",
               label: "",
               path: "/",
               id: "center/",
               type: "center" };

  
  nodes.push(node);
  console.log(data.length);
  // Create all nodes
  for( var i in data ){
    var item = data[i];
    node = { label : item.path.substring( item.path.lastIndexOf('/')+1 ),
                id : item.path,
                path: item.path };
                
    if( item.is_dir ){
      node.thumb = "../img/folder.png";
      node.type = "folder";     
    }
    else{
      node.thumb = "../img/file.png";
      node.type = "file";          
    }

    nodes.push(node);
  }

  for(var i = 1; i < nodes.length; i++) {
    // Create links between center node and all other
    links.push({ source : 0,
                  target : i,
                  weight : 1
    });
    
  };
  restart();  
};

