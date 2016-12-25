/* 
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Finite State Machine Designer
Author : Sean Xiao
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/

function Edge (attrs) {
	var dflt = {
		edge: true,
		fsm: null,
		x: 0,
		y: 0,
		color: 'black',
		displayColor: 'black',
		endX: 0,
		endY: 0,
		u: null,
		v: null,
		para: 0.5,
		perp: 0,
		text: '',
		textColor: 'black',
		textDisplayColor: 'black',
		fontSize: 14,
		textAdjust: 0,
		startArrow: false,
		endArrow: true
	}
	attrs = mergeWithDefault(attrs, dflt);
	
	this.edge = attrs.edge;
	this.fsm = attrs.fsm;
	this.x = attrs.x;
	this.y = attrs.y;
	this.color = attrs.color;
	this.displayColor = attrs.displayColor;
	this.endX = attrs.endX;
	this.endY = attrs.endY;
	this.u = attrs.u;
	this.v = attrs.v;
	this.para = attrs.para;
	this.perp = attrs.perp;
	this.text = attrs.text;
	this.textColor = attrs.textColor;
	this.textDisplayColor = attrs.textDisplayColor;
	this.fontSize = attrs.fontSize;
	this.textAdjust = attrs.textAdjust;
	this.startArrow = attrs.startArrow;
	this.endArrow = attrs.endArrow;
}
/**
 * Toggle whether edge is directed
 * @param {none}
 * @return {none}
 */
Edge.prototype.toggleArrow = function (x, y) {
	if (this.within(x, y, null, 0.5))
		this.startArrow = !this.startArrow;
	if (this.within(x, y, 0.5, null))
		this.endArrow = !this.endArrow;
}
/**
 * Return arc object
 * @param {none}
 * @return {Object} arc
 */
Edge.prototype.getArc = function () {
	// Straight line
	if (this.perp == 0 || this.u == null || this.v == null)
		return null;

	// Arc
	var anchor = getAnchor(this.u, this.v, this.para, this.perp);
	var circle = getCircle(this.u.x, this.u.y, this.v.x, this.v.y, anchor.x, anchor.y);
	var reverse = this.perp > 0 ? 1 : -1;
	var startAngle = Math.atan2(this.u.y - circle.y, this.u.x - circle.x) - reverse * this.u.radius / circle.radius;
	var endAngle = Math.atan2(this.v.y - circle.y, this.v.x - circle.x) + reverse * this.v.radius / circle.radius;
	var startX = circle.x + circle.radius * Math.cos(startAngle);
	var startY = circle.y + circle.radius * Math.sin(startAngle);
	var endX = circle.x + circle.radius * Math.cos(endAngle);
	var endY = circle.y + circle.radius * Math.sin(endAngle);
	return {
		startX: startX,
		startY: startY,
		endX: endX,
		endY: endY,
		startAngle: startAngle,
		endAngle: endAngle,
		x: circle.x,
		y: circle.y,
		radius: circle.radius,
		reverse: reverse
	};
}
/**
 * Return true if point is within edge
 * @param {Integer} x location of point
 * @param {Integer} y location of point
 * @param {Integer} start percentage of curve
 * @param {Integer} end percentage of curve
 * @return {Boolean} returns true if point is within edge
 */
Edge.prototype.within = function (x, y, start = null, end = null) {
	var arc = this.getArc();

	if (arc != null) {
		if (arc.reverse == 1) {
			var temp = arc.startAngle;
			arc.startAngle = arc.endAngle;
			arc.endAngle = temp;
		}
		if (arc.endAngle < arc.startAngle) {
			arc.endAngle += Math.PI * 2;
		}

		// Adjust angle bounds for start and end percentages
		if (arc.reverse == 1) {
			if (start != null)
				arc.endAngle = arc.endAngle + start * (arc.startAngle - arc.endAngle);
			if (end != null)
				arc.startAngle = arc.endAngle + end * (arc.startAngle - arc.endAngle);
		}
		else {
			if (start != null)
				arc.startAngle = arc.startAngle + start * (arc.endAngle - arc.startAngle);
			if (end != null)
				arc.endAngle = arc.startAngle + end * (arc.endAngle - arc.startAngle);
		}

		var dx = x - arc.x;
		var dy = y - arc.y;
		var distance = Math.sqrt(dx * dx + dy * dy) - arc.radius;

		if(Math.abs(distance) < this.fsm.linePadding) {
			var angle = Math.atan2(dy, dx);
			if (angle < arc.startAngle) {
				angle += Math.PI * 2;
			}
			else if(angle > arc.endAngle) {
				angle -= Math.PI * 2;
			}

			return (angle > arc.startAngle && angle < arc.endAngle);
		}
	}
	else {
		var startX = this.x;
		var startY = this.y;
		var endX = this.endX;
		var endY = this.endY;
		if (start != null) {
			startX = startX + start * (endX - startX);
			startY = startY + start * (endY - startY);
		}
		if (end != null) {
			endX = startX + end * (endX - startX);
			endY = startY + end * (endY - startY);
		}

		var dx = endX - startX;
		var dy = endY - startY;
		var length = Math.sqrt(dx * dx + dy * dy);
		var percent = (dx * (x - startX) + dy * (y - startY)) / (length * length);
		var distance = (dx * (y - startY) - dy * (x - startX)) / length;
		
		return (percent >= 0 && percent <= 1 && Math.abs(distance) < this.fsm.linePadding);
	}

	return false;
}
/**
 * Draws the edge along with arrow and text
 * @param {Object} canvas context
 * @return {none}
 */
Edge.prototype.draw = function (context) {
	context.save();

	if (this.u != null) {
		this.x = this.u.x;
		this.y = this.u.y;
	}
	if (this.v != null) {
		this.endX = this.v.x;
		this.endY = this.v.y;
	}
	
	context.beginPath();
	context.strokeStyle = this.displayColor;

	var arc = this.getArc();
	if (arc != null) {
		context.arc(arc.x, arc.y, arc.radius, arc.startAngle, arc.endAngle, (arc. reverse == 1));
	}
	else {
		var v = this.v;
		if (v == null) {
			var select = this.fsm.selectNode(this.endX, this.endY);
			if (select == null) {
				v = new Object();
				v.x = this.endX;
				v.y = this.endY;
				v.radius = 0;
			}
			else {
				v = select.obj;
			}
		}

		var midX = (this.u.x + v.x) / 2;
		var midY = (this.u.y + v.y) / 2;
		var start = circleProjection(this.u, midX, midY);
		var end = circleProjection(v, midX, midY);
		this.x = start.x;
		this.y = start.y;
		this.endX = end.x;
		this.endY = end.y;
		
		context.moveTo(start.x, start.y);
		context.lineTo(end.x, end.y);
	}
	
	context.stroke();

	// Draw arrows
	this.drawArrows(context, arc, this.startArrow, this.endArrow);

	// Draw text
	if (arc != null) {
		if(arc.endAngle < arc.startAngle) {
			arc.endAngle += Math.PI * 2;
		}
		var textAngle = (arc.startAngle + arc.endAngle) / 2;
		if (arc.reverse == 1)
			textAngle += Math.PI;
		var textX = arc.x + arc.radius * Math.cos(textAngle);
		var textY = arc.y + arc.radius * Math.sin(textAngle);

		drawText(context, this.text, textX, textY, textAngle, this);
	}
	else {
		var textX = (this.x + this.endX) / 2;
		var textY = (this.y + this.endY) / 2;
		var textAngle = Math.atan2(this.endX - this.x, this.y - this.endY);

		drawText(context, this.text, textX, textY, textAngle + this.textAdjust, this);
	}

	context.restore();
}
/**
 * Draws arrows
 * @param {Object} canvas context
 * @param {Boolean} draw start arrow if true
 * @param {Boolean} draw end errow if true
 * @return {none}
 */
Edge.prototype.drawArrows = function (context, arc, start, end) {
	context.save();
	
	if (start) {
		var angle = Math.atan2(this.endY - this.y, this.endX - this.x) + Math.PI;
		var x = this.x;
		var y = this.y;
		if (arc != null) {
			angle = arc.startAngle + arc.reverse * (Math.PI / 2);
			x = arc.startX;
			y = arc.startY;
		}
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		context.beginPath();
		context.fillStyle = this.displayColor;
		context.moveTo(x, y);
		context.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
		context.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
		context.fill();
	}
	if (end) {
		var angle = Math.atan2(this.endY - this.y, this.endX - this.x);
		var x = this.endX;
		var y = this.endY;
		if (arc != null) {
			angle = arc.endAngle - arc.reverse * (Math.PI / 2);
			x = arc.endX;
			y = arc.endY;
		}
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		context.beginPath();
		context.fillStyle = this.displayColor;
		context.moveTo(x, y);
		context.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
		context.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
		context.fill();
	}

	context.restore();
}
/**
 * Called when dragged
 * @param {Object} drag information
 * @return {none}
 */
Edge.prototype.drag = function (attrs) {
	if (this.v == null) {
		this.endX = attrs.x;
		this.endY = attrs.y;
	}
	else {
		var anchor = setAnchorPoint(this.u, this.v, attrs.x, attrs.y, this.fsm.linePadding);
		this.para = anchor.para;
		this.perp = anchor.perp;
		this.textAdjust = anchor.textAdjust;
	}
}
/**
 * Called when dragging stops
 * @param {Object} drag information
 * @return {none}
 */
Edge.prototype.unselectDrag = function (attrs) {
	var select = this.fsm.selectNode(attrs.x, attrs.y);
	if (this.v == null && select != null) {
		var v = select.obj;
		this.v = v;
		this.endX = v.x;
		this.endY = v.y;

		this.setEndpoints();
	}
	else if (this.v == null) {
		this.remove();
	}
}
/**
 * Create references to itself in its two end nodes
 * @param {none}
 * @return {none}
 */
Edge.prototype.setEndpoints = function () {
	// Create references to itself in its two end nodes
	if (this.u != null)
		this.u.addEdge(this);
	if (this.v != null)
		this.v.addEdge(this);
}
/**
 * Called when selected
 * @param {none}
 * @return {none}
 */
Edge.prototype.select = function () {
	this.displayColor = 'blue';
	this.textDisplayColor = 'blue';
}
/**
 * Called when unselected
 * @param {none}
 * @return {none}
 */
Edge.prototype.unselect = function () {
	this.displayColor = this.color;
	this.textDisplayColor = this.textColor;
}
/**
 * Removes itself
 * @param {none}
 * @return {none}
 */
Edge.prototype.remove = function () {
	// Remove self from edge lists of endpoints
	if (this.u != null) {
		var i = this.u.edges.indexOf(this);
		this.u.edges.splice(i, 1);
	}
	if (this.v != null) {
		var i = this.v.edges.indexOf(this);
		this.v.edges.splice(i, 1);
	}

	// Remove edge
	var i = this.fsm.edges.indexOf(this);
	if (i > -1)
		this.fsm.edges.splice(i, 1);
}

//Convert edge to latex ------------------------------------------------
//Ty based Evan
var scale = 0.1;
Edge.prototype.arc = function(){
    var getArc = this.getArc();
    var x = getArc.x * scale;
    var y = getArc.y * scale;
		var radius = getArc.radius * scale;
    var startAngle = getArc.startAngle;
    var endAngle = getArc.endAngle; 
    //isReversed
		if(this.perp > 0) {
      var temp = startAngle;
      startAngle = endAngle;
      endAngle = temp;
    }
    if(endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    // TikZ needs the angles to be in between -2pi and 2pi or it breaks
    if(Math.min(startAngle, endAngle) < -2*Math.PI) {
      startAngle += 2*Math.PI;
      endAngle += 2*Math.PI;
    } else if(Math.max(startAngle, endAngle) > 2*Math.PI) {
      startAngle -= 2*Math.PI;
      endAngle -= 2*Math.PI;
    }
    startAngle = -startAngle;
    endAngle = -endAngle;
    first = (x + radius * Math.cos(startAngle)).toFixed(3);
    second = (-y + radius * Math.sin(startAngle)).toFixed(3); 
    third = (startAngle * 180 / Math.PI).toFixed(5) 
    fourth =  (endAngle * 180 / Math.PI).toFixed(5) 
    return '\\draw [' + this.color + '] (' + first + ',' + second + ') arc (' + third + ':' + fourth + ':' + radius.toFixed(3) + ');\n';
  }
Edge.prototype.sline = function(){
  var x = this.x * scale;
  var y = this.y * scale;
  var endX = this.endX * scale;
  var endY = this.endY * scale;
  return '\\draw['+ this.color +']('+x.toFixed(3)+','+-y.toFixed(3)+') -- ('+ endX.toFixed(3)+','+ -endY.toFixed(3) +');\n';
     
}

Edge.prototype.createArrow = function(){
  var getArc = this.getArc();
  var angle = Math.atan2(this.endY - this.y, this.endX - this.x);
  var x = this.endX;
  var y = this.endY;
  if(getArc != null){
    x = getArc.endX;
    y = getArc.endY; 
	  angle = getArc.endAngle - getArc.reverse * (Math.PI / 2);
  }
	var dx = Math.cos(angle);
	var dy = Math.sin(angle);
  var x3 = x * scale;
  var y3 = y * scale;
  var x1 = (x - 8 * dx + 5 * dy) * scale;
  var y1 = (y - 8 * dy - 5 * dx) * scale;
	var x2 = (x - 8 * dx - 5 * dy) * scale;
  var y2 = (y - 8 * dy + 5 * dx) * scale;
  return '\\fill['+ this.color +']('+x1.toFixed(3)+','+-y1.toFixed(3)+') -- ('+ x2.toFixed(3)+','+-y2.toFixed(3)+') -- ('+ x3.toFixed(3)+','+ -y3.toFixed(3) +');\n';

}

var greekLetterNames = [ 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' ];

function convertLatexShortcuts(text) {
	// html greek characters
	for(var i = 0; i < greekLetterNames.length; i++) {
		var name = greekLetterNames[i];
		text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16)));
		text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16)));
	}

	// subscripts
	for(var i = 0; i < 10; i++) {
		text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
	}

	return text;
}

Edge.prototype.createText = function(){
  if(this.text == ''){
    return ''; 
  }
  //var startAngle = endAngle = Math.atan2(this.endY - this.y, this.endX - this.x);
  
  var getArc = this.getArc();
  
	var x = (this.x + this.endX) / 2;
	var y = (this.y + this.endY) / 2;
	var angleOrNull = Math.atan2(this.endX - this.x, this.y - this.endY);
  //var lineAngleAdjust = (this.perp < 0) * Math.PI;
  //angleOrNull += lineAngleAdjust
  var text = this.text; 
  var c=document.getElementById("canvas");
  var ctx=c.getContext("2d");
  var width = ctx.measureText(text).width;
  // center the text
  x -= width / 2;
  text = convertLatexShortcuts(this.text);

  if(getArc != null){
    var startAngle = getArc.startAngle;
    var endAngle = getArc.endAngle;
    if(endAngle < startAngle) {
        endAngle += Math.PI * 2;
    }
    console.log(getArc.reverse);
    angleOrNull = (startAngle + endAngle) / 2 
    if(getArc.reverse == 1){
      angleOrNull += Math.PI
    }
    x = getArc.x + getArc.radius * Math.cos(angleOrNull);
    y = getArc.y + getArc.radius * Math.sin(angleOrNull);
  }
  // position the text intelligently if given an angle
  if(angleOrNull != null) {
      var cos = Math.cos(angleOrNull);
      var sin = Math.sin(angleOrNull);
      var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
      var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
      var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
      x += cornerPointX - sin * slide;
      y += cornerPointY + cos * slide;
  }
  console.log(x,y);
  
	// draw text and caret (round the coordinates so the caret falls on a pixel)
  //
	var nodeParams = '';
  // x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
  if(angleOrNull != null) {
    var dx = Math.cos(angleOrNull);
    var dy = Math.sin(angleOrNull);
    if(Math.abs(dx) > Math.abs(dy)) {
      if(dx > 0) nodeParams = '[right] ', x -= width / 2;
      else nodeParams = '[left] ', x += width / 2;
    } else {
      if(dy > 0) nodeParams = '[below] ', y -= 10;
      else nodeParams = '[above] ', y += 10;
    }
  }
  x *= scale;
  y *= scale;

  return '\\draw (' + x.toFixed(2) + ',' + -y.toFixed(2) + ') node ' + nodeParams + '{$' + text + '$};\n';
}

Edge.prototype.toLatex = function(){
    var arrow = this.createArrow();
    var text = this.createText(); 
    if(this.getArc() == null){
      return this.sline() + arrow + text;
    }
    else{
      return this.arc() + arrow + text; 
    }
  
}
