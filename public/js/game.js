// Socket connection
var socket;
var gameEnabled = false;
var cnv;
var button;
var room;

var rows = 17;
var cols = 25;
var board;

var SelectStatusEnum = {
   START: 101,
   END: 102,
 };
var selectStatus = SelectStatusEnum.START; // toggle to switch between start and finish
var alreadyMoved = false;

var iStart = -1;
var jStart = -1;
var iEnd = -1;
var jEnd = -1;

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
        if(j > 12) { // Player 1
          board[j][i] = new Hole(i, j, HoleStatusENum.PLAYER1)
        } else if(j < 4) { // Player 2
          board[j][i] = new Hole(i, j, HoleStatusENum.PLAYER2)
        } else { // all other holes
          board[j][i] = new Hole(i, j, HoleStatusENum.EMPTY)
        }
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
  var found = false;
  var iFound = -1;
  var jFound = -1;
  loop:
  for (var j = 0; j < 17; j++) {
    for (var i = 0; i < 25; i++) {
      if(boardHoles[j][i])
        if(board[j][i].clicked()){
          found = true;
          iFound = i;
          jFound = j;
          break loop;
        }
    }
  }

  if(found)
  {
    if(board[jFound][iFound].status.id === HoleStatusENum.PLAYER1.id && !alreadyMoved)
    {
      if(iStart > 0 && jStart > 0){ // we've already selected a player1 ball previously
        board[jStart][iStart].setSelected(false); // un selected previous ball
        console.log("Unselected Start (i,j) : (" + iStart+","+ jStart+")" );
      }
      iStart = iFound;
      jStart = jFound;
      board[jStart][iStart].setSelected(true);
      selectStatus = SelectStatusEnum.END;

      console.log("  Selected Start (i,j) : (" + iStart+","+ jStart+")" );
    }
    else if(selectStatus === SelectStatusEnum.END)
    {
      iEnd = iFound;
      jEnd = jFound;
      console.log("Selected Dest (i,j) : (" + iEnd+","+ jEnd+")" );
      if(validMove()) {
        board[jStart][iStart].status = HoleStatusENum.EMPTY;
        board[jEnd][iEnd].status = HoleStatusENum.PLAYER1;
        board[jStart][iStart].setSelected(false);
        board[jEnd][iEnd].setSelected(true);
        jStart = jEnd;
        iStart = iEnd;
        alreadyMoved = true;
      }
    }
  }
}

function validMove() {
  if(board[jEnd][iEnd].status.id === HoleStatusENum.EMPTY.id) {
    if(iStart-1 === iEnd) {
      if(jStart-1 === jEnd){
        return true;           // TOP
      }
      if(jStart+1 === jEnd){
        return true;
      }
    }
    else if(iStart+1 === iEnd) {
      if(jStart-1 === jEnd){
        return true;
      }
      if(jStart+1 === jEnd){
        return true;
      }
    }
    else if(jStart === jEnd) {
      if(iStart-2 === iEnd){
        return true;
      }
      if(iStart+2 === iEnd){
        return true;
      }
    }
  }
  console.log("Move is not valid");
  return false;
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
  //drawCenterButton();
}
