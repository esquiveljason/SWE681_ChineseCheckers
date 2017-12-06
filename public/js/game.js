// Socket connection
/*jshint esversion: 6 */
var socket;
var playerTurn;
var cnv;            // p5 Canvas
var joinGameButton; // Join Game button
var doneTurnButton; // Button to end turn
var waitingMsg;     // Waiting Msg to display
var statusMsg;      // "Other player turn" msg
var gameOverMsg;    // Game over message
var gameState;    // Indicates status of game waiting, active, finished
var room;           // assigned room for this user

var newBoardTemplate  = "rrrrrrrrrrooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooobbbbbbbbbb";

var username;
var usernameMsg;

var GameStateEnum = {
  GAMEWAIT : 200,
  GAMEJOINED : 201,
  GAMEACTIVE : 202,
  GAMEDISCONNECTED: 203,
  GAMEFINISHED : 204
};

var Boolean = {
  FALSE : 0,
  TRUE : 1
};

var TOTALROWS = 17; // ROWS for board
var TOTALCOLS = 25; // COLS for board
var board;     // 2D array of holes indicating board status

var SelectStatusEnum = {   // flags to ndicates wether start ball has been selected
   START: 101,
   END: 102,
 };
var selectStatus; // toggle to switch between start and finish
var alreadyMoved; // Already started moving, prevent moving of another ball

var iStart;  // Postions of selected ball
var jStart;
var iEnd;    // Positions of selected slot for ball to move to
var jEnd;

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
  // Set state to game wait
  gameState = GameStateEnum.GAMEWAIT;

  // Initialize Canvas
  cnv = createCanvas(800, 510);
  background(51);
  centerCanvas();
  frameRate(30); // 30 fps

  // setupBoard
  setupBoard(newBoardTemplate);

  // instantiate waiting msg
  drawWaitingMsg();
  // instantiate status msg
  drawStatusMsg();
  // instantiate done button
  drawDoneTurnButton();

  waitingMsg.hide();
  statusMsg.hide();
  doneTurnButton.hide();

  // Draw Button to join game and start Socket
  drawJoinGameButton();
  joinGameButton.mousePressed(joinGameButtonListener);

  //TESTING
  username = document.getElementById('user').name;
  drawUsernameMsg();

}
// Setup board
function setupBoard(template) {
  var b_c = 0;
  // instantiate empty 2d array for board
  board = make2DArray(boardHoles.length, boardHoles[0].length);
  // Set up Holes for all valid ones in board
  for (var j = 0; j < TOTALROWS; j++) {
    for (var i = 0; i < TOTALCOLS; i++) {
      if(boardHoles[j][i]) {
        //
        if(template[b_c] === "b") { // Player1
          board[j][i] = new Hole(i, j, HoleStatusEnum.PLAYER1);
        } else if(template[b_c] === "r") { // Player2
          board[j][i] = new Hole(i, j, HoleStatusEnum.PLAYER2);
        } else {
          board[j][i] = new Hole(i, j, HoleStatusEnum.EMPTY);
        }
        b_c++;
      }
    }
  }
}

// Listener when join button is pressed.
function joinGameButtonListener() {
  joinGameButton.hide(); // hide Join Button
  if(gameState === GameStateEnum.GAMEFINISHED)
    gameOverMsg.hide();
  // Initialize variables
  playerTurn = Boolean.FALSE;
  selectStatus = SelectStatusEnum.START; // toggle to switch between start and finish
  alreadyMoved = Boolean.FALSE; // Already started moving, prevent moving of another ball
  iStart = -1;  // Postions of selected ball
  jStart = -1;
  iEnd = -1;    // Positions of selected slot for ball to move to
  jEnd = -1;

  setUpSocket();
}
/*
 * Setupsocket for this user and set up listeners
 * Current listeners
 * 'updateMsg'   - player 2 update updateData
 * 'roomMsg'     - room name for this player
 * 'doneTurnMsg' - player 1 done doneTurnMsg
 * 'newGameMsg'  - send message to server to start new Game
 * 'startGameMsg' - start game message from server - when 2 players are connected
 * 'gameOverMsg' - send Game over message to other player if sending (won) receiving (lost)
 * 'defaultWinMsg' - Automatically win other user disconnected
 * 'userDiscMsg'   - other user has disconnected
 * 'otherUserReCntMsg' - other user has reconnected
 * 'userRecntMsg' - this uer has reconnected
 */
function setUpSocket() {
  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update' to updateCanva
  socket.on('updateMsg', updateMsgHandler);
  // Listerner to set room for socket and startGame
  socket.on('roomMsg', roomMsgHandler);
  // Listener when other player is done with Turn
  socket.on('doneTurnMsg', doneTurnMsgHandler);
  // Start Game Msg
  socket.on('startGameMsg', startGameMsgHandler);
  // Game Over message
  socket.on('gameOverMsg', gameOverMsgHandler);
  // Automatic win message
  socket.on('defaultWinMsg', defaultWinMsgHandler);
  // User has disconnected Msg
  socket.on('userDiscMsg', userDiscMsgHandler);
  // other User has reconnected msg
  socket.on('otherUserReCntMsg', otherUserReCntMsgHandler);
  // user reconnected Msg
  socket.on('userRecntMsg', userReCntMsgHandler);
  // Send out message to try to start new game, this user is ready to play
  socket.emit('newGameMsg', {username: username});
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

  sendUpdateBoardMsg();
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
  gameState = GameStateEnum.GAMEJOINED;
  room = data.room; // Set room for this user

  console.log("Received Room Update Message : " + room + " PlayerTurn Flag : " + playerTurn);

  waitingMsg.show();

}

/*
 * Handler for starting game message
 */
function startGameMsgHandler() {
  console.log("Received Start Game Message");
  gameState = GameStateEnum.GAMEACTIVE;
  // Remove waiting msg
  waitingMsg.hide();

  repositionDoneTurnButton();
  repositionStatusMsg();
  if(playerTurn === Boolean.TRUE){
    statusMsg.hide();
    doneTurnButton.show();
  } else {
    statusMsg.show();
    doneTurnButton.hide();
  }
}

/*
 * Handler for 'doneTurnMsg' - shows doneTurnButton
 */
function doneTurnMsgHandler() {
  console.log("Received Done Turn Msg, Is my Turn");
  playerTurn = Boolean.TRUE;
  selectStatus = SelectStatusEnum.START; // toggle to switch between start and finish
  alreadyMoved = Boolean.FALSE; // Already started moving, prevent moving of another ball

  iStart = -1;  // Postions of selected ball
  jStart = -1;
  iEnd = -1;    // Positions of selected slot for ball to move to
  jEnd = -1;

  if(gameState === GameStateEnum.GAMEACTIVE) {
    doneTurnButton.show();
    statusMsg.hide();
  }
  sendUpdateBoardMsg();
}

/*
 * Handler for 'gameOverMsg'
 * If we receive this we lost
 */
function gameOverMsgHandler() {
  console.log("Loser!!!!!!!!!!!!!!!!!!!!!!!!!!!11");
  gameState = GameStateEnum.GAMEFINISHED;

  // hide done button and status msg
  doneTurnButton.hide();
  statusMsg.hide();
  repositionJoinGameButton(); // reposition just in case
  joinGameButton.show();

  // call draw game over msg
  drawGameOverMsg(false); // false for loser
}

/*
 * Handler for 'defaultWinMsg'
 * If user receives this, automatic win
 */
function defaultWinMsgHandler() {
  console.log("Winner!!!!!!!!!!!!!!!!!!!!!!!!!!!11");
  gameState = GameStateEnum.GAMEFINISHED;


  repositionJoinGameButton(); // reposition just in case
  joinGameButton.show();

  // call draw game over msg
  drawGameOverMsg(true); // false for loser
}
/*
 * Handler for 'userDiscMsg'
 */
function userDiscMsgHandler() {
  console.log("User Disconnected Message Handler");
  // hide done button and status msg
  doneTurnButton.hide();
  statusMsg.hide();
  gameState = GameStateEnum.DISCONNECTED;
}
/*
 * Handler for 'userDiscMsg'
 */
function otherUserReCntMsgHandler() {
  console.log("User Reconnected Message Handler");
  if(playerTurn === Boolean.TRUE) {
    doneTurnButton.show();
  } else {
    statusMsg.show();
  }
  gameState = GameStateEnum.GAMEACTIVE;
}
/*
 * Handler for 'userDiscMsg'
 */
function userReCntMsgHandler(data) {
  console.log("Reconnecting to previous game");
  console.log(`Room : ${data.room} playerTurn : ${data.turn} selectStatus : ${data.selectstatus} alreadyMoved : ${data.alreadymoved}`);
  console.log(`iStart : ${data.istart} jStart : ${data.jstart} iEnd : ${data.iend} jEnd : ${data.jend}`);
  room = data.room;
  playerTurn = data.turn;
  gameState = GameStateEnum.GAMEACTIVE;
  setupBoard(data.board);
  selectStatus = data.selectstatus;//SelectStatusEnum.START;
  alreadyMoved = data.alreadymoved;//Boolean.FALSE;
  iStart = data.istart;//-1;  // Postions of selected ball
  jStart = data.jstart;//-1;
  iEnd = data.iend;//-1;    // Positions of selected slot for ball to move to
  jEnd = data.jend;//-1;
  waitingMsg.hide();

  if(playerTurn === Boolean.TRUE) {
    doneTurnButton.show();
    statusMsg.hide();
    if(alreadyMoved === Boolean.TRUE) {
      if(selectStatus === SelectStatusEnum.END){

        jStart = jEnd;
        iStart = iEnd;
        board[jStart][iStart].setSelected(true);
      }
    }
  } else {
    doneTurnButton.hide();
    statusMsg.show();
  }

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
 * 1) finds with hole was pressed, set validSelected = true if hole is pressed gets iSelected, jSelected
 * 2) Checks if hole pressed is player1(current) hole and previous ball hasn't already moved
 *    Set iStart, jStart, setSelected(true) and status to look for destination
 * 3) if already have start, check if destination is valid
 *    if valid move ball to empty slot, sendUpdateMsg to other player
 */
function mousePressed() {
  var validSelected = false;
  var iSelected = -1;
  var jSelected = -1;
  // 1) Finds hole that was pressed
  if(gameState === GameStateEnum.GAMEACTIVE) {
    if(playerTurn === Boolean.TRUE) { // don't allow click if not player turn
      loop:
      for (var j = 0; j < 17; j++) {
        for (var i = 0; i < 25; i++) {
          if(boardHoles[j][i])
            if(board[j][i].clicked()){
              validSelected = true;
              iSelected = i;
              jSelected = j;
              break loop;
            }
        }
      }
    }

    if(validSelected)
    {
      //2) Checks if hole pressed is player1(current) hole and previous ball hasn't already moved
      //    Set iStart, jStart, setSelected(true) and status to look for destination
      if(board[jSelected][iSelected].status.id === HoleStatusEnum.PLAYER1.id &&  (alreadyMoved === Boolean.FALSE))
      {
        if(iStart > 0 && jStart > 0){ // we've already selected a player1 ball previously
          board[jStart][iStart].setSelected(false); // un selected previous ball
          console.log("Unselected Start (i,j) : (" + iStart+","+ jStart+")" );
        }
        iStart = iSelected;
        jStart = jSelected;
        board[jStart][iStart].setSelected(true);
        selectStatus = SelectStatusEnum.END;

        console.log("  Selected Start (i,j) : (" + iStart+","+ jStart+")" );
      }
      // 3) if already have start, check if destination is valid
      //    if valid move ball to empty slot, sendUpdateMsg to other player
      else if(selectStatus === SelectStatusEnum.END)
      {
        iEnd = iSelected;
        jEnd = jSelected;
        console.log("Selected Dest (i,j) : (" + iEnd+","+ jEnd+")" );
        if(validMove()) {
          board[jStart][iStart].status = HoleStatusEnum.EMPTY;
          board[jEnd][iEnd].status = HoleStatusEnum.PLAYER1;
          board[jStart][iStart].setSelected(false);
          board[jEnd][iEnd].setSelected(true);
          alreadyMoved = Boolean.TRUE;
          sendUpdateMsg();
          jStart = jEnd;
          iStart = iEnd;

          if(checkWon()){
            gameOver(true); // true for won game
          }
        }
      }
    }
  }
}

/*
 * User is winner
 */

function gameOver(won) {
  console.log("Winner!!!!!!!!!!!!!!!!!!!!!!!!!!!11");
  gameState = GameStateEnum.GAMEFINISHED;

  // hide done button and status msg
  doneTurnButton.hide();
  statusMsg.hide();
  repositionJoinGameButton(); // reposition just in case
  joinGameButton.show();

  // Display winner
  drawGameOverMsg(won);

  // Send message the game over
  socket.emit('gameOverMsg', {room: room, username: username}); // needs room to forward
}


/*
 * Checks if move is valid from (jStart, iStart)  to (jEnd, iEnd)
 * returns true is jump is valid, else false
 */
function validMove() {
  if(board[jEnd][iEnd].status.id === HoleStatusEnum.EMPTY.id) { // make sure destination is empty
    if(alreadyMoved === Boolean.FALSE) { // can only jump length 1 once, length 2 over other ball multiple times
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

/*
 * Checks to see if user has won game
 */
function checkWon(){
  // All holes above in rows 0-3 are player1
  // All other holes are either player2 or empty
  // for all validHoles
  var count = 0;
  for (var j = 0; j < TOTALROWS; j++) {
    for (var i = 0; i < TOTALCOLS; i++) {
      if(boardHoles[j][i]) {
        if(j < 4) { // check only top portion
          if(board[j][i].status.id == HoleStatusEnum.PLAYER1.id) {
            count++;
          }
        }
      }
    }
  }
  if(count === 10) {
    return true;
  } else {
    return false;
  }
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

  sendUpdateBoardMsg();
}

function sendUpdateBoardMsg(){
  var currBoardTemplate = getCurrentBoardTemplate();
  var data = {
    username: username,
    turn: playerTurn,
    selectstatus : selectStatus,
    alreadymoved : alreadyMoved,
    istart : iStart,
    jstart : jStart,
    iend : iEnd,
    jend : jEnd,
    board: currBoardTemplate };
  socket.emit("updateBoardMsg", data );

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

function repositionJoinGameButton() {
  joinGameButton.position(cnv.x + 525 , cnv.y + 200);
}
/*
 * Draw Done Turn Button
 */
function drawDoneTurnButton() {
  if(doneTurnButton == null) {
    doneTurnButton = createButton('Done');
    console.log("created done button");
  }
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

function repositionDoneTurnButton(){
  doneTurnButton.position(cnv.x + 525 , cnv.y + 100);
}

// Listener when done button is pressed
function doneTurnButtonListener() {
  if(alreadyMoved === Boolean.TRUE) // if a move was made send update else can't
  {
    var currBoardTemplate = getCurrentBoardTemplate();
    console.log(currBoardTemplate);
    playerTurn = Boolean.FALSE; // make it not clickable
    socket.emit("doneTurnMsg", {username: username, room : room, turn: playerTurn }); // send msg to room indicating user is done with turn
    sendUpdateBoardMsg();

    doneTurnButton.hide(); // hide done turn button
    board[jStart][iStart].setSelected(false); // unselect hole
    statusMsg.show();

  }
}
function drawWaitingMsg() {
  waitingMsg = createElement('p',"Waiting for Player to Join");
  waitingMsg.style("color", "white");
  waitingMsg.style("font-size", "24px");
  waitingMsg.position(cnv.x + 525 , cnv.y + 100);
}
function repositionWaitingMsg() {
  waitingMsg.position(cnv.x + 525 , cnv.y + 100);
}

function drawStatusMsg() {
  statusMsg = createElement('p',"Other Player Turn");
  statusMsg.style("color", "white");
  statusMsg.style("font-size", "24px");
  statusMsg.position(cnv.x + 525 , cnv.y + 100);
}
function repositionStatusMsg() {
  statusMsg.position(cnv.x + 525 , cnv.y + 100);
}

function drawGameOverMsg(winner) {
  var msg;
  if(winner)
  {
    msg = "  Game Over \n   Winner!!";
  } else {
    msg = "  Game Over \n   Loser!!";
  }
  gameOverMsg = createElement('p',msg);
  gameOverMsg.style("color", "white");
  gameOverMsg.style("font-size", "24px");
  gameOverMsg.position(cnv.x + 525 , cnv.y + 100);
}
function repositionGameOverMsg() {
  gameOverMsg.position(cnv.x + 525 , cnv.y + 100);
}
function drawUsernameMsg(winner) {
  usernameMsg = createElement('p',username);
  usernameMsg.style("color", "white");
  usernameMsg.style("font-size", "24px");
  usernameMsg.position(cnv.x + 650 , cnv.y + 15);
}
function repositionUsernameMsg() {
  usernameMsg.position(cnv.x + 650 , cnv.y + 15);
}

/*
 * p5 function to resize the canvas when window is resized
 */
function windowResized() {
  centerCanvas();
  repositionUsernameMsg();
  if( gameState === GameStateEnum.GAMEWAIT) {
    drawJoinGameButton();
  } else if (gameState === GameStateEnum.GAMEJOINED) {
    repositionWaitingMsg();
  } else if(gameState === GameStateEnum.GAMEACTIVE) {
    repositionDoneTurnButton();
    repositionStatusMsg();
  } else if(gameState === GameStateEnum.GAMEFINISHED) {
    repositionGameOverMsg();
    drawJoinGameButton();
  }

}

function getCurrentBoardTemplate() {
  var template = "";
  for (var j = 0; j < TOTALROWS; j++) {
    for (var i = 0; i < TOTALCOLS; i++) {
      if(boardHoles[j][i]) {
        template += board[j][i].status.rep;
      }
    }
  }
  return template;
}
