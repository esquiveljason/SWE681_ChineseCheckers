// Socket connection
var socket;

function setup() {
  // put setup code here
  var cnv = createCanvas(640, 480);
  background(51);
  cnv.parent('game-holder');

  // Start socket connection to the server
  socket = io.connect('https://localhost:8000');
  // Update event called 'update'
  socket.on('update',
    // when we receive data
    function(data) {
      // Draw from update
      noStroke();
      fill(255,105,180);
      ellipse(data.x, data.y, 20, 20);
    })
}

function draw() {
  // Nothing
}

function mouseDragged() {
  noStroke();
	fill(255);
	ellipse(mouseX, mouseY, 20,20);

  // Send update message
  sendUpdate(mouseX, mouseY);
}

// Function for sending to the socket
function sendUpdate(xpos, ypos) {
  // Make data update object
  var updateData = {
    x: xpos,
    y: ypos
  };

  // Send that object to the socket
  socket.emit('update', updateData);
}
