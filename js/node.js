/* 
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Finite State Machine Designer
Author : Sean Xiao
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/

function Node (attrs) {
	var dflt = {
		node: true,
		fsm: null,
		x: 0,
		y: 0,
		color: 'black',
		displayColor: 'black',
		radius: 30,
		fill: 'none',
		text: '',
		textColor: 'black',
		textDisplayColor: 'black',
		fontSize: 14,
		edges: [],
		accept: false
	};
	attrs = mergeWithDefault(attrs, dflt);
	
	this.node = attrs.node;
	this.fsm = attrs.fsm;
	this.x = attrs.x;
	this.y = attrs.y;
	this.color = attrs.color;
	this.displayColor = attrs.displayColor;
	this.radius = attrs.radius;
	this.width = 2 * attrs.radius;
	this.height = 2 * attrs.radius;
	this.fill = attrs.fill;
	this.text = attrs.text;
	this.textColor = attrs.textColor;
	this.textDisplayColor = attrs.textDisplayColor;
	this.fontSize = attrs.fontSize;
	this.edges = attrs.edges;
	this.accept = attrs.accept;
}
Node.prototype.toggleAccept = function () {
	this.accept = !this.accept;
}
Node.prototype.draw = function (context) {
	context.save();

	context.beginPath();
	context.strokeStyle = this.displayColor;
	context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
	if (this.fill != 'none') {
		context.fillStyle = this.fill;
		context.fill();
	}
	context.stroke();

	// Draw accept state
	if (this.accept) {
		context.beginPath();
		context.arc(this.x, this.y, this.radius * 0.85, 0, 2 * Math.PI);
		context.stroke();
	}
	
	drawText(context, this.text, this.x, this.y, null, this);

	context.restore();
}
/**
 * Return true if point is within edge
 * @param {Integer} x location of point
 * @param {Integer} y location of point
 * @return {Boolean} returns true if point is within edge
 */
Node.prototype.within = function (x, y) {
	var xDist = x - this.x;
	var yDist = y - this.y;
	if (Math.sqrt(xDist * xDist + yDist * yDist) <= this.radius)
		return true;
	return false;
}
Node.prototype.drag = function (attrs) {
	var x = attrs.x + attrs.xOffset;
	var y = attrs.y + attrs.yOffset;

	// Snap to position
	for (var i = 0; i < this.fsm.nodes.length; i++) {
		var node = this.fsm.nodes[i];
		if (this != node && this.fsm.focus.indexOf(node) < 0) {
			if (Math.abs(x - node.x) < this.fsm.snapPadding)
				x = node.x;
			if (Math.abs(y - node.y) < this.fsm.snapPadding)
				y = node.y;
		}
	}

	this.x = x;
	this.y = y;
}
Node.prototype.unselectDrag = function (attrs) {

}
Node.prototype.select = function () {
	this.displayColor = 'blue';
	this.textDisplayColor = 'blue';
}
Node.prototype.unselect = function () {
	this.displayColor = this.color;
	this.textDisplayColor = this.textColor;
}
Node.prototype.addEdge = function (e) {
	this.edges.push(e);
}
Node.prototype.removeEdge = function (e) {
	this.edges.push(e);
}
Node.prototype.remove = function () {
	// Remove attached edges
	while (this.edges.length > 0) {
		this.edges[0].remove();
	}

	// Remove node
	var i = this.fsm.nodes.indexOf(this);
	if (i > -1)
		this.fsm.nodes.splice(i, 1);
}
Node.prototype.toLatex = function(){
    var x = this.x * scale
    var y = this.y * scale;
		var radius = this.radius * scale;
		var tex = '\\draw [' + this.color + '] (' + x.toFixed(3) + ',' + -y.toFixed(3) + ') circle (' + radius.toFixed(3) + ');\n';
    if(this.text != ''){
      tex += '\\draw (' + x.toFixed(3) + ',' + -y.toFixed(3) + ') node {'+ this.text +'};\n';
    }
    return tex;
}
