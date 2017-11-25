// Socket connection
var socket;
var gameEnabled = false;
var cnv;
var button;
var room;

function setup() {
  // put setup code here
  cnv = createCanvas(720, 480);
  background(51);
  centerCanvas();

  drawCenterButton();

  button.mousePressed(enable);

}

function setUpSocket() {
  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update'
  socket.on('update', updateCanvas);

  socket.on('room', setRoom)

  socket.emit('newgame');
  console.log("Emitting new game");

}
function enable() {
  gameEnabled = true;
  button.remove();

  setUpSocket();
}
function updateCanvas(data) {
  if(gameEnabled)
  {
    // Draw from update
    noStroke();
    fill(255,0,102);
    ellipse(data.x, data.y, 20, 20);
  }
}
function setRoom(data) {
  room = data.room;
  console.log("Room : " + data.room);
}

function draw() {
  // Nothing
}

function mouseDragged() {
  // Make data update object
  var updateData = {
    room: room,
    x: mouseX,
    y: mouseY
  };

  // update Canvas
  updateCanvas(updateData)

  // Send update message
  sendUpdate(updateData);
}

// Function for sending to the socket
function sendUpdate(updateData) {
  // Send that object to the socket
  socket.emit('update', updateData);
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
