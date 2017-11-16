function setup() {
  // put setup code here
  var cnv = createCanvas(640, 480);
  cnv.parent('game-holder');
}

function draw() {
  // put drawing code here
	if (mouseIsPressed) {
		fill(0);
	} else {
		fill(128);
	}
	ellipse(mouseX, mouseY, 80,80);
  }
