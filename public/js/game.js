// Socket connection
var socket;
var gameEnabled = false;
var cnv;
var joinGameButton; // Join Game button
var doneTurnButton; // Button to end turn
var room;

var TOTALROWS = 17; // ROWS for board
var TOTALCOLS = 25; // COLS for board
var board;     // 2D array of holes indicating board status

var SelectStatusEnum = {   // flags to ndicates wether start ball has been selected
   START: 101,
   END: 102,
 };
var selectStatus = SelectStatusEnum.START; // toggle to switch between start and finish
var alreadyMoved = false; // Already started moving, prevent moving of another ball

var iStart = -1;  // Postions of selected ball
var jStart = -1;
var iEnd = -1;    // Positions of selected slot for ball to move to
var jEnd = -1;

// true if ball is allowed on slot
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


// Make empty 2d array
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

  // instantiate empty 2d array for board
  board = make2DArray(boardHoles.length, boardHoles[0].length);

  for (var j = 0; j < TOTALROWS; j++) {
    for (var i = 0; i < TOTALCOLS; i++) {
      if(boardHoles[j][i])
        if(j > 12) { // Player 1
          board[j][i] = new Hole(i, j, HoleStatusEnum.PLAYER1)
        } else if(j < 4) { // Player 2
          board[j][i] = new Hole(i, j, HoleStatusEnum.PLAYER2)
        } else { // all other holes
          board[j][i] = new Hole(i, j, HoleStatusEnum.EMPTY)
        }
    }
  }

  // Draw Button to join game and start Socket
  drawJoinGameButton();
  joinGameButton.mousePressed(joinGameButtonListener);

}

// Listener when button is pressed.
function joinGameButtonListener() {
  joinGameButton.remove();

  setUpSocket();
}

function setUpSocket() {
  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update' to updateCanva
  socket.on('update', updateBoardReceived);
  // Listerner to set room for socket and startGame
  socket.on('room', setRoom)

  // Send out message to try to start new game, this user is ready to play
  socket.emit('newgame');
  console.log("Emitting new game");

}

function updateBoardReceived(data) {
  console.log("Update Start (i,j) : (" + data.iStart+","+ data.jStart+")" );
  console.log("Update End   (i,j) : (" + data.iEnd+","+ data.jEnd+")" );
  board[data.jStart][data.iStart].status = HoleStatusEnum.EMPTY;
  board[data.jEnd][data.iEnd].status = HoleStatusEnum.PLAYER2;
}

// Listner to set room when received from server
function setRoom(data) {

  gameEnabled = data.startGame;
  room = data.room;
  console.log("Received Room Update Message : " + room + " StartGame Flag : " + gameEnabled);
  if(gameEnabled)
    drawDoneTurnButton();
}

// Draw board
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
    if(board[jFound][iFound].status.id === HoleStatusEnum.PLAYER1.id && !alreadyMoved)
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
        board[jStart][iStart].status = HoleStatusEnum.EMPTY;
        board[jEnd][iEnd].status = HoleStatusEnum.PLAYER1;
        board[jStart][iStart].setSelected(false);
        board[jEnd][iEnd].setSelected(true);
        sendUpdate();
        jStart = jEnd;
        iStart = iEnd;
        alreadyMoved = true;

      }
    }
  }
}

// Checks if move is valid from (jStart, iStart)  to (jEnd, iEnd)
function validMove() {
  if(board[jEnd][iEnd].status.id === HoleStatusEnum.EMPTY.id) {
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
// Function for sending to the socket
function sendUpdate() {

  var updateData = {
    iStart: Math.abs(iStart - TOTALCOLS) - 1,
    jStart: Math.abs(jStart - TOTALROWS) - 1,
    iEnd:   Math.abs(iEnd - TOTALCOLS) - 1,
    jEnd:   Math.abs(jEnd - TOTALROWS) - 1,
    room: room
  };
  // Send that object to the socket
  socket.emit('update', updateData);
  console.log("Sending update to : " + updateData.room);
}

function centerCanvas(){
  var x = (windowWidth - width) / 2;
  cnv.position(x, 200);
}

function drawJoinGameButton() {
  if(joinGameButton == null)
    joinGameButton = createButton('Join Game');

  joinGameButton.style("background-color" ,  "#4CAF50" ); //green
  joinGameButton.style("border", "none");
  joinGameButton.style("color", "white");
  joinGameButton.style("padding", "15px 32px");
  joinGameButton.style("font-size", "40px");
  joinGameButton.style("width", "249px");
  joinGameButton.position(cnv.x + 525 , cnv.y + 200);
}

function drawDoneTurnButton() {
  if(doneTurnButton == null)
    doneTurnButton = createButton('Done');

  doneTurnButton.style("background-color" ,  "#4CAF50" ); //green
  doneTurnButton.style("border", "none");
  doneTurnButton.style("color", "white");
  doneTurnButton.style("padding", "15px 32px");
  doneTurnButton.style("font-size", "40px");
  doneTurnButton.style("width", "249px");
  doneTurnButton.position(cnv.x + 525 , cnv.y + 100);
}

function windowResized() {
  centerCanvas();
  drawJoinGameButton();
}
