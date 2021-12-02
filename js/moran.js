
//
// Global variables and state
//

var graphs = [Kn(4),K1_3,Kn(5),K1_4,Kn(6),C(5), function(){return ER(5);}];


// SVG objects
var paper;
var background;
var nodesSVG = [];
var edgesSVG = {};
var backedgesSVG = [];

// lengths
var canvasW;
var canvasH;

// Default graph
var G; 

// States
var ui_state = 'waiting';
var easing_function;
var sim_state = 'ini';
var mutants;
var Nmutants;
var fixationProbability = [0,0];

// Simulation fitness
var fitness = NaN;


// ************************************************************************* //
//        UI functions
// ************************************************************************* //

function setUIstate(new_state) {
  if( ui_state == new_state ) return;
  
  ui_state = new_state;
  $('.moran-button').toggleClass('active');
  $('.dropdown-content').toggleClass('active');
}


function SetGraph(graph) {

  // Set global graph
  if(graph instanceof Function) {
    G = graph();
  } else {
    G = graph;
  }
  
  
  // Reset simulation
  ResetSimulation();
  
  // Set title
  $('#graph_name>.label').html(G.name);
  
  // Draw graph
  DrawGraph();
}

function SetFitness(new_fitness){
  if( fitness === new_fitness ) return;
  
  // Set fitness label
  fitness = new_fitness;
  $('#fitness .label').html(fitness);

  // Reset simulation
  ResetSimulation();

  // Draw graph
  DrawGraph();
}


// ************************************************************************* //
//        Drawing and simulation functions
// ************************************************************************* //


// A function to draw the graph
function DrawGraph(){
  
  // clear everything
  paper.clear();
  nodesSVG = [];
  edgesSVG = {};
  backedgesSVG = [];
  
  // Draw graph
  for( var v=0 ; v < G.order ; v++ ){
    // Draw a node
    nodesSVG.push(paper.circle((G.nodePos[v].x+1.2)*canvasW/2.4, 
                                (G.nodePos[v].y+1.2)*canvasH/2.4, canvasW/15)
                          .attr(css_resident)
                          .attr(css_unactive)
                          .toFront());
    // Draw edges, only if the neightbour is larger
    for( var j=0 ; j<G.neighbours[v].length ; j++ ){
      var w = G.neighbours[v][j];
      if( v < w ){ // Already drawn
        edgesSVG[String(v)+"-"+String(w)] = 
          paper.path( "M" + (G.nodePos[v].x+1.2)*canvasW/2.4 + ","
                          + (G.nodePos[v].y+1.2)*canvasH/2.4 +
                      "L" + (G.nodePos[w].x+1.2)*canvasW/2.4 + ","
                          + (G.nodePos[w].y+1.2)*canvasH/2.4       )
               .attr(css_edge)
               .toBack();
        backedgesSVG.push( 
          paper.path( "M" + (G.nodePos[v].x+1.2)*canvasW/2.4 + ","
                          + (G.nodePos[v].y+1.2)*canvasH/2.4 +
                      "L" + (G.nodePos[w].x+1.2)*canvasW/2.4 + ","
                          + (G.nodePos[w].y+1.2)*canvasH/2.4       ) 
                .attr(css_back_edge)
                .toBack()
        );
      }else{
        // If not, just make a reference 
        edgesSVG[String(v)+"-"+String(w)] = edgesSVG[String(w)+"-"+String(v)];
      }
    }
  }
  
  // Draw background
  background = paper.rect(3, 3, canvasW-6, canvasH-6, 20)
    .toBack()
    .attr(css_background);

}

// A function to make one step of the simulation
function OneStep(lag, callback){
  var v, w;
  
  switch(sim_state){
    
  // We have to reset the population and choose a random mutant
  case 'ini':
    // Reset population
    //mutants = new Int8Array(10).fill(0); // we are using ES6!
    mutants = [];
    for(var i = 0 ; i<G.order ; i++ ) mutants.push(0);
    
    // Reset the colours of everything
    // Clearing everything seems easier than reseting attribs
    paper.clear();
    DrawGraph(G);
    
    // Take one as a mutant
    v = Math.floor(Math.random()*G.order); 
    mutants[v] = 1;
    Nmutants = 1;
    
    //OK now, animate the thing
    nodesSVG[v].animate(css_mutant, lag, easing_function, function(){
      sim_state = 'ready';
      callback();
    });
    break;

  // Just one usual step of the simulation, choose the one to reproduce,
  // the one to die and make the change
  case 'ready':
    // random value to chose the one to reproduce
    var tmp = Math.random() * (fitness * Nmutants + G.order - Nmutants);
    var acummulator = 0;
    
    for( v=0 ; v<G.order-1 ; v++ ){
      acummulator += (mutants[v])?fitness:1;
      if( acummulator > tmp ) break;
    }
    // v has the right node. Now choose ont of its neighbours to die
    w = G.neighbours[v][Math.floor(Math.random() * G.neighbours[v].length)];
    
    // Update accordingly the variables
    if( mutants[w] != mutants[v] ){
      Nmutants += (mutants[v])?1:-1; 
      mutants[w] = mutants[v];
    }
    
    // Start the animation
    nodesSVG[v].animate(css_active, lag, easing_function, 
      function(){
        sim_state = 'ready';
        edgesSVG[String(v)+"-"+String(w)].animate(css_active, lag, easing_function, 
          function(){
            nodesSVG[w].animate(css_active, lag, easing_function, 
              function(){
                nodesSVG[w].animate((mutants[v])?css_mutant:css_resident, lag, easing_function,
                  function(){
                    nodesSVG[v].animate(css_unactive, lag, easing_function,
                      function(){
                        // At this point we have finished the animation of the 
                        // invasion process
                        if( Nmutants == 0 || Nmutants == G.order) { //absorption
                          background.animate( Nmutants?css_background_live:css_background_dead, lag, easing_function, 
                            function(){
                              // Update the fixation probability 
                              fixationProbability[1]++;
                              if( Nmutants ) fixationProbability[0]++;
                              sim_state = 'ini'; // Ready for reinitialization
                              // Update the GUI
                              callback();
                            }
                          );
                          for( var i=0 ; i<backedgesSVG.length ; i++ )
                            backedgesSVG[i].animateWith(background, null, Nmutants?css_back_edge_live:css_back_edge_dead, lag, easing_function );
                        } else {
                          // In other case we are still in ready case!
                          callback();
                        }
                      }
                    );
                    edgesSVG[String(v)+"-"+String(w)].animateWith(nodesSVG[v], null, css_unactive, lag, easing_function);
                    nodesSVG[w].animateWith(nodesSVG[v], null, css_unactive, lag, easing_function);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
}

// Clears everything about the simulation, including graph
function ResetSimulation(){
  sim_state = "ini";
  mutants = [];
  Nmutants = 0;
  fixationProbability = [0,0];
}


// ************************************************************************* //
//         "Entry point"
// ************************************************************************* //
$(document).ready(function(){
  var canvas = $('#canvas');
  var i;
  canvasW = canvas.width();
  canvasH = canvas.height();
  
  // Create the "context" fro canvas
  paper = Raphael("canvas", canvasW, canvasH);
  
  // Set default graph
  SetGraph(graphs[0]);
  
  // Set default fitness
  SetFitness(1);
  
  // Create the UI from graphs array
  var links = '';
  for( var i=0 ; i<graphs.length ; i++ )
    links += '<a href="#" id="' + String(i) + '">' 
             + ((graphs[i] instanceof Function)?graphs[i]().name:graphs[i].name)  + '</a>';
  $("#graph_name .dropdown-content").html(links);
  
  //Greate GUI for fitness
  links = '';
  for( var i=1 ; i<10 ; i++ )
    links += 
      '<a href="#" id="' + String(i) + '"><span class="circle mutant"></span> = ' 
                         + String(i) + ' <span class="circle resident"></span>';
  $("#fitness .dropdown-content").html(links);
  
  
  // Add event handlers
  // 1 step
  $('#1step').click(function(){
    if(ui_state == 'working') return;
    setUIstate('working');
    easing_function = 'elastic';
    OneStep(400, function(){ setUIstate('waiting'); });
  });
  
  // 1 iteration
  $('#1iteration').click(function(){
    if(ui_state == 'working') return;

    var lastNumIt = fixationProbability[1];
    easing_function = 'linear';
    
    var CallBackFunction1 = function(){
      if(lastNumIt == fixationProbability[1]){
        // We have not finished the iteration
        OneStep(50, CallBackFunction1);
      } else {
        // Finished!
        setUIstate('waiting');
      }
    };
    
    setUIstate('working');
    OneStep(50, CallBackFunction1);
  });
  
  // Select new graph
  $("#graph_name .dropdown-content a").click(function(e){
    SetGraph( graphs[parseInt($(this).attr('id'))] )
  });

  // Set fitness
  $("#fitness .dropdown-content a").click(function(e){
    SetFitness( parseFloat($(this).attr('id')) )
  });

  
});


