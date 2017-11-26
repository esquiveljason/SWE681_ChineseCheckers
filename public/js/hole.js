
 var SIZE_X = 20; // each slot is 20 pixels wide
 var SIZE_Y = 30; // each slot is 30 pixels long
 var CENTER_OFFSET = 15;

 var WIDTH = 25;

/*
 * Indexes
 * Position i in board 2d Array - i,x = column
 * Position j in board 2d array - j,y = row
 */
function Hole(i,j) {
  this.i = i;
  this.j = j;
  this.x = i*SIZE_X + 15;
  this.y = j*SIZE_Y + 15;

}

Hole.prototype.show = function() {
      fill(255);
      ellipseMode(CENTER);
      ellipse(this.x, this.y, WIDTH);
}

Hole.prototype.clicked = function() {
  var d = dist(mouseX,mouseY,this.x,this.y)
  if(d < WIDTH/2) {
    console.log("Clicked Hole (i,j)  : (" + this.i+","+this.j+")" );
  }
}
