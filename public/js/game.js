// Socket connection
var socket;
var playerTurn = false;
var cnv;            // p5 Canvas
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
  frameRate(30); // 30 fps

  // instantiate empty 2d array for board
  board = make2DArray(boardHoles.length, boardHoles[0].length);

  // Draw and color board, white for empty, blue for player1, red for player 2
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

// Listener when join button is pressed.
function joinGameButtonListener() {
  joinGameButton.remove(); // don't need no more

  setUpSocket();
}
/*
 * Setupsocket for this user and set up listeners
 * Current listeners
 * 'updateMsg'   - player 2 update updateData
 * 'roomMsg'     - room name for this player
 * 'doneTurnMsg' - player 1 done doneTurnMsg
 * 'newGameMsg'  - send message to server to start new Game
 */
function setUpSocket() {
  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update' to updateCanva
  socket.on('updateMsg', updateMsgHandler);
  // Listerner to set room for socket and startGame
  socket.on('roomMsg', roomMsgHandler);
  //
  socket.on('doneTurnMsg', doneTurnMsgHandler);
  // Send out message to try to start new game, this user is ready to play
  socket.emit('newGameMsg');
  console.log("Emitting new game");

}
/*
 * Handler for 'updateMsg' message is received, contains player 2 update updateData
 * updateBoardData.iStart - i index for player 2 ball original position
 * updateBoardData.jStart - j index for player 2 ball original position
 * updateBoardData.iEnd   - i index for player 2 ball destination position
 * updateBoardData.jEnd   - j index for player 2 ball destination position
 */
function updateMsgHandler(updateBoardData) {
  console.log("Update Start (i,j) : (" + updateBoardData.iStart+","+ updateBoardData.jStart+")" );
  console.log("Update End   (i,j) : (" + updateBoardData.iEnd+","+ updateBoardData.jEnd+")" );
  board[updateBoardData.jStart][updateBoardData.iStart].status = HoleStatusEnum.EMPTY;
  board[updateBoardData.jEnd][updateBoardData.iEnd].status = HoleStatusEnum.PLAYER2;
}

/*
 * Handler for 'roomMsg' set room when received from server
 * data.startGame - true or false flag to start game
 * data.room - room for this user
 */
function roomMsgHandler(data) {
  // from room msg, true when 2 players connected, first player connected will get true
  // Second player connected will get false, will be second
  playerTurn = data.playerTurn;
  // Set room for this user
  room = data.room;
  console.log("Received Room Update Message : " + room + " PlayerTurn Flag : " + playerTurn);
  drawDoneTurnButton();
  if(!playerTurn)
    doneTurnButton.hide()
}

/*
 * Handler for 'doneTurnMsg' - shows doneTurnButton
 */
function doneTurnMsgHandler() {
  doneTurnButton.show();
  playerTurn = true;
  selectStatus = SelectStatusEnum.START; // toggle to switch between start and finish
  alreadyMoved = false; // Already started moving, prevent moving of another ball

  iStart = -1;  // Postions of selected ball
  jStart = -1;
  iEnd = -1;    // Positions of selected slot for ball to move to
  jEnd = -1;
}

/*
 * p5 function called at framerate set to 30 fps in setUpSocket
 * draws that status of each hole
 */
function draw() {
  for (var j = 0; j < 17; j++) {
    for (var i = 0; i < 25; i++) {
      if(boardHoles[j][i])
        board[j][i].show();
    }
  }

}
/*
 * p5 function called when mouse is pressed
 * 1) finds with hole was pressed, set found = true if hole is pressed gets iFound, jFound
 * 2) Checks if hole pressed is player1(current) hole and previous ball hasn't already moved
 *    Set iStart, jStart, setSelected(true) and status to look for destination
 * 3) if already have start, check if destination is valid
 *    if valid move ball to empty slot, sendUpdateMsg to other player
 */
function mousePressed() {
  // 1) Finds hole that was pressed
  if(playerTurn) { // don't allow click if gamenotenabled
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
  }

  if(found)
  {
    //2) Checks if hole pressed is player1(current) hole and previous ball hasn't already moved
    //    Set iStart, jStart, setSelected(true) and status to look for destination
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
    // 3) if already have start, check if destination is valid
    //    if valid move ball to empty slot, sendUpdateMsg to other player
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
        sendUpdateMsg();
        jStart = jEnd;
        iStart = iEnd;
        alreadyMoved = true;

      }
    }
  }
}

/*
 * Checks if move is valid from (jStart, iStart)  to (jEnd, iEnd)
 * returns true is jump is valid, else false
 */
function validMove() {
  if(board[jEnd][iEnd].status.id === HoleStatusEnum.EMPTY.id) { // make sure destination is empty
    if(!alreadyMoved) { // can only jump length 1 once, length 2 over other ball multiple times
      if(iStart-1 === iEnd) {
        if(jStart-1 === jEnd){
          return true;           // TOP LEFT JUMP
        }
        if(jStart+1 === jEnd){
          return true;           // BOTTOM LEFT JUMP
        }
      }
      else if(iStart+1 === iEnd) {
        if(jStart-1 === jEnd){
          return true;           // TOP RIGHT JUMP
        }
        if(jStart+1 === jEnd){
          return true;           // BOTTOM RIGHT JUMP
        }
      }
      else if(jStart === jEnd) {
        if(iStart-2 === iEnd){
          return true;           // LEFT JUMP
        }
        if(iStart+2 === iEnd){
          return true;           // RIGHT JUMP
        }
      }
    }

    // Jump over another ball, as many times possilbe
    if(iStart-2 === iEnd) {
      if(jStart-2 === jEnd){
        if(board[jStart-1][iStart-1].status.id !== HoleStatusEnum.EMPTY.id) { // ensure jumping over ball
          return true;           // TOP LEFT JUMP
        }
      }
      if(jStart+2 === jEnd){
        if(board[jStart+1][iStart-1].status.id !== HoleStatusEnum.EMPTY.id) {
          return true;           // BOTTOM LEFT JUMP
        }
      }
    }
    else if(iStart+2 === iEnd) {
      if(jStart-2 === jEnd){
        if(board[jStart-1][iStart+1].status.id !== HoleStatusEnum.EMPTY.id) {
          return true;           // TOP RIGHT JUMP
        }
      }
      if(jStart+2 === jEnd){
        if(board[jStart+1][iStart+1].status.id !== HoleStatusEnum.EMPTY.id) {
          return true;           // BOTTOM RIGHT JUMP
        }
      }
    }
    else if(jStart === jEnd) {
      if(iStart-4 === iEnd){
        if(board[jStart][iStart-2].status.id !== HoleStatusEnum.EMPTY.id) {
          return true;            // LEFT JUMP
        }
      }
      if(iStart+4 === iEnd){
        if(board[jStart][iStart+2].status.id !== HoleStatusEnum.EMPTY.id) {
          return true;           // RIGHT JUMP
        }
      }
    }
  }
  console.log("Move is not valid");
  return false;
}
// Function for sending to the socket
function sendUpdateMsg() {

  var updateData = {
    // Conversion for player 2 view
    iStart: Math.abs(iStart - TOTALCOLS) - 1,
    jStart: Math.abs(jStart - TOTALROWS) - 1,
    iEnd:   Math.abs(iEnd - TOTALCOLS) - 1,
    jEnd:   Math.abs(jEnd - TOTALROWS) - 1,
    room: room // room to send to
  };
  // Send that object to the socket
  socket.emit('updateMsg', updateData);
  console.log("Sending update to : " + updateData.room);
}

/*
 * Center the Canvas
 */
function centerCanvas(){
  var x = (windowWidth - width) / 2;
  cnv.position(x, 200);
}

/*
 * Draw Join Game Button
 */
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
/*
 * Draw Done Turn Button
 */
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

  // Set listener for done turn button
  doneTurnButton.mousePressed(doneTurnButtonListener);
}

// Listener when done button is pressed
function doneTurnButtonListener() {
  playerTurn = false; // make it not clickable
  socket.emit("doneTurnMsg", {room : room}); // send msg to room indicating user is done with turn
  doneTurnButton.hide(); // hide done turn button
  board[jStart][iStart].setSelected(false); // unselect hole
}
/*
 * p5 function to resize the canvas when window is resized
 */
function windowResized() {
  centerCanvas();
  drawJoinGameButton();
  drawDoneTurnButton();
  if(!playerTurn)
    doneTurnButton.hide()
}
