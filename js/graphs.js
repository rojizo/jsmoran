//
// Graphs. Nodes are numerated from 0 to order-1
//

function Kn(order) {
  var G = {
    'name': '<em>K</em><sub>' + String(order) + '</sub>',
    'order': order,
    'neighbours': [],
    'nodePos': []
  }
  
  // To center it vertically
  var yshift = ((order%2)==0)?0:((1-Math.cos(Math.PI/order))/2);
  
  for( var i=0 ; i<order ; i++ ){
    G.nodePos.push({'x': 0.9*Math.cos(2*Math.PI/order*i - Math.PI/2), 
                    'y': 0.9*Math.sin(2*Math.PI/order*i - Math.PI/2) + yshift });
    G.neighbours.push([]);
    for( var v=0 ; v<order ; v++ )
      if( v!=i ) G.neighbours[i].push(v);
  }
  
  return G;
}


var K1_3 = {
  'name': '<em>K</em><sub>1,3</sub>',
  'order': 4,
  'neighbours': [ [1,2,3], [0], [0], [0] ],
  'nodePos': []
};
var K1_4 = {
  'name': '<em>K</em><sub>1,4</sub>',
  'order': 5,
  'neighbours': [ [1,2,3,4], [0], [0], [0], [0] ],
  'nodePos': []
};
// Set the positions of the graphs in the canvas (inside [-1,1]x[-1,1])
K1_3.nodePos.push({'x':0, 'y':0.9*0.25});
for( var i=0 ; i<3 ; i++ ){
  K1_3.nodePos.push({'x':0.9*Math.cos(2*Math.PI/3*i + Math.PI/6 ), 
                     'y':0.9*Math.sin(2*Math.PI/3*i + Math.PI/6 ) + K1_3.nodePos[0].y });
}
K1_4.nodePos.push({'x':0, 'y':0});
for( var i=0 ; i<4 ; i++ ){
  K1_4.nodePos.push({'x':0.9*Math.cos(Math.PI/2*i), 
                     'y':0.9*Math.sin(Math.PI/2*i)});
}



