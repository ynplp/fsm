/* 
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Finite State Machine Designer
Author : Sean Xiao
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/

Function.prototype.inheritsFrom = function (parent) {
  if (parent.constructor == Function) {
    //Normal Inheritance
    this.prototype = new parent;
    this.prototype.constructor = this;
    this.prototype.parent = parent.prototype;
  }
  else {
    //Pure Virtual Inheritance
    this.prototype = parent;
    this.prototype.constructor = this;
    this.prototype.parent = parent;
  }
  return this;
}

function mergeObjects(obj1, obj2) {
  var result = {};
  for (var attrname in obj1) {
    result[attrname] = obj1[attrname];
  }
  for (var attrname in obj2) {
    result[attrname] = obj2[attrname];
  }
  return result;
}

function mergeWithDefault(attrs, dflt) {
  var result = defaultIfUndefined(attrs, dflt);
  result = mergeObjects(dflt, attrs);
  
  return result;
}

function defaultIfUndefined(val, dflt) {
  if (typeof (val) == 'undefined') {
    return dflt;
  }
  return val;
}

function zoom(e, fsm, mouseX, mouseY) {
  e.preventDefault();
  
  var delta = e.wheelDelta == null ? e.detail * -100 : e.wheelDelta;
  var delta = delta / 1000;
  if (fsm.scale + delta > 4)
    delta = 4 - fsm.scale;
  else if (fsm.scale + delta < 0.25)
    delta = 0.25 - fsm.scale;
  
  fsm.left -= mouseX * delta;
  fsm.top -= mouseY * delta;
  fsm.scale += delta;
  fsm.draw();

  return false;
}

function isNode(obj) {
  return (obj.node != null && obj.node);
}

function isEdge(obj) {
  return (obj.edge != null && obj.edge);
}

function colorFromVal(val) {
  if (val == 0)
    return 'black';
  else if (val == 1)
    return 'white';
  else if (val == 2)
    return 'red';
  else if (val == 3)
    return 'green';
  else if (val == 4)
    return 'blue';
  else if (val == 5)
    return 'cyan';
  else if (val == 6)
    return 'magenta';
  else if (val == 7)
    return 'yellow';
  else if (val == 8)
    return 'transparent';
  return 'black';
}

function valFromColor(color) {
  if (color == 'black')
    return 0;
  else if (color == 'white')
    return 1;
  else if (color == 'red')
    return 2;
  else if (color == 'green')
    return 3;
  else if (color == 'blue')
    return 4;
  else if (color == 'cyan')
    return 5;
  else if (color == 'magenta')
    return 6;
  else if (color == 'yellow')
    return 7;
  else if (color == 'transparent' || color == 'none')
    return 8;
  return 0;
}

/*
 * Utils from MadeByEvan
*/

function drawText(context, text, x, y, angle, obj) {
  context.save();

  context.font = obj.fontSize + 'px Computer Modern Roman';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = obj.textDisplayColor;
  
  var width = context.measureText(text).width;
  // Position text intelligently
  if(angle != null) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    x += cornerPointX - sin * slide;
    y += cornerPointY + cos * slide;
  }

  context.fillText(text, x, y);

  if (obj.fsm.focus.indexOf(obj) > -1 && obj.fsm.caret.visible) {
    x += width / 2 + 1;
    x = Math.round(x);
    y = Math.round(y);

    context.beginPath();
    context.strokeStyle = obj.textDisplayColor;
    canvas.lineWidth = 1;
    context.moveTo(x, y - obj.fontSize / 2);
    context.lineTo(x, y + obj.fontSize / 2);
    context.stroke();
  }

  context.restore();
}

function getAnchor(u, v, para, perp) {
  var dx = v.x - u.x;
  var dy = v.y - u.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    x: u.x + dx * para - dy * perp / scale,
    y: u.y + dy * para + dx * perp / scale
  };
}

function setAnchorPoint(u, v, x, y, padding) {
  var dx = v.x - u.x;
  var dy = v.y - u.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  var para = (dx * (x - u.x) + dy * (y - u.y)) / (scale * scale);
  var perp = (dx * (y - u.y) - dy * (x - u.x)) / scale;
  var textAdjust = (perp < 0) ? Math.PI : 0;
  if(para > 0 && para < 1 && Math.abs(perp) < padding)
    perp = 0;

  return {
    para: para,
    perp: perp,
    textAdjust: textAdjust
  };
}

function det(a, b, c, d, e, f, g, h, i) {
  return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

function getCircle(x1, y1, x2, y2, x3, y3) {
  var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
  var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
  var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
  var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
  return {
    x: -bx / (2 * a),
    y: -by / (2 * a),
    radius: Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a))
  };
}

function circleProjection(node, x, y) {
  var dx = x - node.x;
  var dy = y - node.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    x: node.x + dx * node.radius / scale,
    y: node.y + dy * node.radius / scale
  };
}
