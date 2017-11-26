// Socket connection
var socket;
var gameEnabled = false;
var cnv;
var button;
var room;

var rows = 17;
var cols = 25;
var board;

var boardHoles = [[false,false,false,false,false,false,false,false,false,false,false,false, true,false,false,false,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false,false,false, true,false, true,false,false,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false,false, true,false, true,false, true,false,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false, true,false, true,false, true,false, true,false,false,false,false,false,false,false,false,false],
                  [ true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true],
                  [false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false],
                  [false,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false,false],
                  [false,false,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false,false,false],
                  [false,false,false,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false,false,false,false],
                  [false,false,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false,false,false],
                  [false,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false,false],
                  [false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false],
                  [ true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true,false, true],
                  [false,false,false,false,false,false,false,false,false, true,false, true,false, true,false, true,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false,false, true,false, true,false, true,false,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false,false,false, true,false, true,false,false,false,false,false,false,false,false,false,false,false],
                  [false,false,false,false,false,false,false,false,false,false,false,false, true,false,false,false,false,false,false,false,false,false,false,false,false]];

 function make2DArray(rows, cols) {
   var arr = new Array(rows);
   for (var i = 0; i < arr.length; i++) {
     arr[i] = new Array(cols);
   }
   return arr;
 }



function setup() {
  // put setup code here
  cnv = createCanvas(800, 510);
  background(51);
  centerCanvas();

  board = make2DArray(boardHoles.length, boardHoles[0].length);

  for (var j = 0; j < 17; j++) {
    for (var i = 0; i < 25; i++) {
      if(boardHoles[j][i])
        board[j][i] = new Hole(i,j);
    }
  }


  /*// Set colors
  fill(204, 101, 192, 127);
  stroke(127, 63, 120);
  for(var y = 0; y < boardHoles.length; y++) {
    for(var x = 0; x < boardHoles[y].length; x++) {
      if(boardHoles[y][x]) {
        var posY = y*30;
        var posX = x*20;
        fill(255);
        ellipseMode(CENTER);
        ellipse(posX+15, posY+15, 25);
      }
      else{
        var posY = y*30;
        var posX = x*20;
        rectMode(CENTER);
        fill(204, 101, 192, 127);
        //rect(posX+15, posY+15, 20,30);
      }

    }
  }*/

  //drawCenterButton();

  //button.mousePressed(enable);

}

function setUpSocket() {
  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update'
  socket.on('update', updateCanvasReceived);

  socket.on('room', setRoom)

  socket.emit('newgame');
  console.log("Emitting new game");

}
function enable() {
  button.remove();

  setUpSocket();
}
function updateCanvas(data) {
  // Draw from update
  noStroke();
  fill(255,0,102);
  ellipse(data.x, data.y, 20, 20);
}

function updateCanvasReceived(data) {
  // Draw from update
  console.log("Receiving update Data")
  noStroke();
  fill(255,0,102);
  ellipse(data.x, data.y, 20, 20);
}

function setRoom(data) {
  gameEnabled = data.startGame;
  room = data.room;
  console.log("Received Room Update Message : " + room + " StartGame Flag : " + gameEnabled);
}

function draw() {
  for (var j = 0; j < 17; j++) {
    for (var i = 0; i < 25; i++) {
      if(boardHoles[j][i])
        board[j][i].show();
    }
  }

}

function mousePressed() {
  for (var j = 0; j < 17; j++) {
    for (var i = 0; i < 25; i++) {
      if(boardHoles[j][i])
        board[j][i].clicked()
    }
  }
}

function mouseDragged() {
  // Make data update object
  var updateData = {
    room: room,
    x: mouseX,
    y: mouseY
  };

  if(gameEnabled){
    // update Canvas
    updateCanvas(updateData)

    // Send update message
    sendUpdate(updateData);
  }
}

// Function for sending to the socket
function sendUpdate(updateData) {
  // Send that object to the socket
  socket.emit('update', updateData);
  console.log("Sending update to : " + updateData.room);
}

function centerCanvas(){
  var x = (windowWidth - width) / 2;
  cnv.position(x, 200);
}

function drawCenterButton() {
  if(button == null)
    button = createButton('Join Game');

  button.style("background-color" ,  "#4CAF50" ); //green
  button.style("border", "none");
  button.style("color", "white");
  button.style("padding", "15px 32px");
  button.style("font-size", "40px");
  button.style("width", "249px");
  button.position(cnv.x + (cnv.width - button.width)/2, 300);
}

function windowResized() {
  centerCanvas();
  drawCenterButton();
}
