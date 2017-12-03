
 var SIZE_X = 20; // each slot is 20 pixels wide
 var SIZE_Y = 30; // each slot is 30 pixels long
 var CENTER_OFFSET = 15;

 var WIDTH = 25;

var HoleStatusEnum = {
   EMPTY: {id: 100, color: "white", rep: "o"},
   PLAYER1: {id: 101, color: "blue", rep: "b"},
   PLAYER2: {id: 102, color: "red", rep: "r"}
 };

/*
 * Indexes
 * Position i in board 2d Array - i,x = column
 * Position j in board 2d array - j,y = row
 */
function Hole(i,j,status) {
  this.i = i;
  this.j = j;
  this.x = i*SIZE_X + CENTER_OFFSET;
  this.y = j*SIZE_Y + CENTER_OFFSET;
  this.status = status;
  this.selected = false;
}

Hole.prototype.show = function() {
  fill(this.status.color);
  ellipseMode(CENTER);
  ellipse(this.x, this.y, WIDTH);

  if(this.selected && this.status.id != HoleStatusEnum.EMPTY.id) { // do not select empty hole
    star(this.x,this.y, 4, 10, 5);
  }
}

Hole.prototype.clicked = function() {

  var d = dist(mouseX,mouseY,this.x,this.y)
  if(d < WIDTH/2.0) {
    console.log("Clicked Hole (i,j)  : (" + this.i+","+this.j+")" );
    return true;
  }
  return false;
}

Hole.prototype.setSelected = function(selected) {
  this.selected = selected;
}

Hole.prototype

function star(x, y, radius1, radius2, npoints) {
  push();
  var angle = TWO_PI / npoints;
  var halfAngle = angle/2.0;
  beginShape();
  fill('white');
  for (var a = 0; a < TWO_PI; a += angle) {
    var sx = x + cos(a) * radius2;
    var sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a+halfAngle) * radius1;
    sy = y + sin(a+halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
  pop();
}
