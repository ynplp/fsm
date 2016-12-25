/* 
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Finite State Machine Designer
Author : Sean Xiao
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
*/

var mouseX = 0;
var mouseY = 0;
var mouseDrag = null;

function FSM (canvas, context) {
	this.canvas = canvas;
	this.context = context;
	this.scale = 1;
	this.left = 0;
	this.top = 0;
	this.nodes = [];
	this.edges = [];
	this.focus = [];
	this.dragFocus = [];
	this.focusXoffset = [];
	this.focusYoffset = [];
	this.snapPadding = 10;
	this.linePadding = 10;
	this.caret = { interval: null, visible: true };
	this.resetCaret();
	this.selectBox = null;
}
FSM.prototype.addNode = function (node) {
	this.nodes.push(node);
}
FSM.prototype.addEdge = function (edge) {
	this.edges.push(edge);
}
FSM.prototype.draw = function () {
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

	this.context.save();
	this.context.translate(this.left, this.top);
	this.context.scale(this.scale, this.scale);
	for (var i = 0; i < this.edges.length; i++) {
		this.context.save();
		this.edges[i].draw(this.context);
		this.context.restore();
	}
	for (var i = 0; i < this.nodes.length; i++) {
		this.context.save();
		this.nodes[i].draw(this.context);
		this.context.restore();
	}
	this.drawSelectBox(this.context);
	this.context.restore();
}
FSM.prototype.selectNode = function (x, y) {
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];

		if (node.within(x, y))
			return { obj: node, xOffset: node.x - x, yOffset: node.y - y };
	}
	return null;
}
FSM.prototype.selectEdge = function (x, y) {
	for (var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i];

		if (edge.within(x, y))
			return { obj: edge, xOffset: 0, yOffset: 0 };
	}
	return null;
}
FSM.prototype.select = function (x, y) {
	var node = this.selectNode(x, y);
	if (node != null)
		return node;
	else
		return this.selectEdge(x, y);
}
FSM.prototype.addFocus = function (obj) {
	this.focus.push(obj.obj);
	obj.obj.select();
	this.draw();
}
FSM.prototype.removeFocus = function (obj) {
	var i = this.focus.indexOf(obj);
	if (i > -1) {
		obj.unselect();
		this.focus.splice(i, 1);
		this.draw();
	}
}
FSM.prototype.unselect = function () {
	this.applyToFocus(function (obj) { obj.unselect(); });
	this.focus = [];
	this.draw();
}
FSM.prototype.applyToFocus = function (func, filter) {
	for (var i = 0; i < this.focus.length; i++) {
		if (filter == null || filter(this.focus[i]))
			func(this.focus[i]);
	}
}
FSM.prototype.addDragFocus = function (obj) {
	var dflt = {
		xOffset: 0,
		yOffset: 0
	};
	obj = mergeWithDefault(obj, dflt);

	this.dragFocus.push(obj.obj);
	this.focusXoffset.push(obj.xOffset);
	this.focusYoffset.push(obj.yOffset);
}
FSM.prototype.unselectDrag = function (x, y) {
	var attrs = { x: x, y: y };
	this.applyToDrag(function (obj) { obj.unselectDrag(attrs); });
	this.dragFocus = [];
	this.focusXoffset = [];
	this.focusYoffset = [];
	this.draw();
}
FSM.prototype.drag = function (x, y) {
	if (this.dragFocus.length > 0) {
		var node = false;
		
		for (var i = 0; i < this.dragFocus.length; i++) {
			var obj = this.dragFocus[i];
			if (isNode(obj)) {
				var attrs = { x: x, y: y, xOffset: this.focusXoffset[i], yOffset: this.focusYoffset[i] };
				obj.drag(attrs);
				node = true;
			}
		}

		if (!node) {
			for (var i = 0; i < this.dragFocus.length; i++) {
				var obj = this.dragFocus[i];
				if (isEdge(obj)) {
					var attrs = { x: x, y: y, xOffset: this.focusXoffset[i], yOffset: this.focusYoffset[i] };
					obj.drag(attrs);
				}
			}
		}

		this.draw();
	}
}
FSM.prototype.applyToDrag = function (func) {
	for (var i = 0; i < this.dragFocus.length; i++) {
		func(this.dragFocus[i]);
	}
}
FSM.prototype.resetCaret = function () {
	clearInterval(this.caret.interval);
	
	var fsm = this;
	toggleCaret = function () { fsm.caret.visible = !(fsm.caret.visible); fsm.draw() };
	
	this.caret.interval = setInterval(toggleCaret, 500);
	this.caret.visible = true;
}
FSM.prototype.withinSelectBox = function () {
	var pick = [];

	var box = {
		x: this.selectBox.x,
		y: this.selectBox.y,
		width: this.selectBox.width,
		height: this.selectBox.height
	};
	if (box.width < 0) {
		box.x += box.width;
		box.width = -1 * box.width;
	}
	if (box.height < 0) {
		box.y += box.height;
		box.height = -1 * box.height;
	}

	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		if (node.x >= box.x && node.x <= box.x + box.width &&
				node.y >= box.y && node.y <= box.y + box.height)
			pick.push(node);
	}
	for (var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i];
		var arc = edge.getArc();
		if (arc == null)
			arc = { startX: edge.x, startY: edge.y, endX: edge.endX, endY: edge.endY };
		if (arc.startX >= box.x && arc.startX <= box.x + box.width &&
				arc.startY >= box.y && arc.startY <= box.y + box.height)
			pick.push(edge);
		else if (arc.endX >= box.x && arc.endX <= box.x + box.width &&
				arc.endY >= box.y && arc.endY <= box.y + box.height)
			pick.push(edge);
	}
	return pick;
}
FSM.prototype.drawSelectBox = function (context) {
	if (this.selectBox != null) {
		context.save();

		context.beginPath();
		context.lineWidth = 0.5 / this.scale;
		context.strokeStyle = 'blue';
		context.rect(this.selectBox.x, this.selectBox.y, this.selectBox.width, this.selectBox.height);
		context.stroke();

		context.restore();
	}
}

var newOnload = function () {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	// Make it HD
	if (!canvas.style.width)
		canvas.style.width = canvas.width + 'px';
	if (!canvas.style.height)
		canvas.style.height = canvas.height + 'px';
	var scale = 2;
	canvas.width = canvas.width * scale;
	canvas.height = canvas.height * scale;
	context.scale(scale, scale);

	var fsm = new FSM(canvas, context);

	canvas.addEventListener('dblclick', function (e) {
		var x = transformXY(fsm, e).x;
		var y = transformXY(fsm, e).y;

		var select = fsm.selectNode(x, y);
		if (select != null) {
			var node = select.obj;
			node.toggleAccept();
		}
		else {
			select = fsm.selectEdge(x, y);
			if (select != null) {
				var edge = select.obj;
				edge.toggleArrow(x, y);
			}
			else {
				var attrs = { fsm: fsm, x: x, y: y };
				var node = new Node(attrs);
				fsm.addNode(node);
			}
		}

		fsm.draw();
	});
	canvas.addEventListener('mousedown', function (e) {
		var x = transformXY(fsm, e).x;
		var y = transformXY(fsm, e).y;

		var select = fsm.select(x, y);
		if (select != null) {
			if (e.shiftKey && isNode(select.obj)) {
				var u = select.obj;

				var attrs = { fsm: fsm, x: x, y: y, endX: x, endY: y, u: u };
				var edge = new Edge(attrs);
				fsm.addEdge(edge);
				fsm.addDragFocus({ obj: edge });
			}
			else if (e.ctrlKey || e.metaKey) {
				if (fsm.focus.indexOf(select.obj) > -1)
					fsm.removeFocus(select.obj);
				else
					fsm.addFocus(select);
			}
			else if (fsm.focus.indexOf(select.obj) > -1) {
				fsm.unselectDrag(x, y);
				fsm.applyToFocus(function (obj) {
					fsm.addDragFocus({
						obj: obj,
						xOffset: obj.x - x,
						yOffset: obj.y - y });
				});
			}
			else {
				fsm.unselect();
				fsm.addFocus(select);
				fsm.addDragFocus(select);
			}
		}
		else {
			if (e.which != 3 && !e.metaKey)
				fsm.unselect();

			if (e.ctrlKey || e.metaKey) {
				fsm.selectBox = { x: x, y: y, width: 0, height: 0 };
			}
			else if (e.which != 3) {
				mouseDrag = { x: e.offsetX, y: e.offsetY };
			}
		}
	});
	canvas.addEventListener('mousemove', function (e) {
		var x = transformXY(fsm, e).x;
		var y = transformXY(fsm, e).y;

		fsm.drag(x, y);

		mouseX = x;
		mouseY = y;

		if (mouseDrag != null && fsm.dragFocus.length == 0) {
			fsm.left += e.offsetX - mouseDrag.x;
			fsm.top += e.offsetY - mouseDrag.y;
			
			mouseDrag.x = e.offsetX;
			mouseDrag.y = e.offsetY;
			
			fsm.draw();
		}

		if (fsm.selectBox != null) {
			fsm.selectBox.width = x - fsm.selectBox.x;
			fsm.selectBox.height = y - fsm.selectBox.y;

			fsm.unselect();
			var pick = fsm.withinSelectBox();
			for (var i = 0; i < pick.length; i++) {
				if (fsm.focus.indexOf(pick[i]) < 0)
					fsm.addFocus({ obj: pick[i] });
			};

			fsm.draw();
		}
	});
	canvas.addEventListener('mouseup', function (e) {
		var x = transformXY(fsm, e).x;
		var y = transformXY(fsm, e).y;

		fsm.unselectDrag(x, y);

		mouseDrag = null;
		fsm.selectBox = null;

		fsm.draw();
	});

	window.onkeydown = function (e) {
		var key = e.keyCode || e.charCode;
		if (fsm.focus.length > 0) {
			if (key == 8) {
				e.preventDefault();
				fsm.applyToFocus(function (obj) { obj.text = obj.text.substr(0, obj.text.length - 1); });
			}
			else if (key == 46)
				fsm.applyToFocus(function (obj) { obj.remove(); });
			fsm.draw();
		}
	};
	window.onkeypress = function (e) {
		var key = e.keyCode || e.charCode;
		if (fsm.focus.length > 0) {
			fsm.applyToFocus(function (obj) { obj.text += String.fromCharCode(key); });
			fsm.draw();
			fsm.resetCaret();
		}
		// // Zoom the canvas in/out
		// else if (e.keyCode == 61) {
		// 	if (fsm.scale <= 1.75) {
		// 		fsm.left -= mouseX / 4;
		// 		fsm.top -= mouseY / 4;
		// 		fsm.scale += 0.25;
		// 		fsm.draw();
		// 	}
		// }
		// else if (e.keyCode == 45) {
		// 	if (fsm.scale >= 0.5) {
		// 		fsm.left += mouseX / 4;
		// 		fsm.top += mouseY / 4;
		// 		fsm.scale -= 0.25;
		// 		fsm.draw();
		// 	}
		// }
	};

	// Scroll to zoom
	var zoomHandler = function (e) {
		zoom(e, fsm, mouseX, mouseY);
	}
	canvas.addEventListener('DOMMouseScroll', zoomHandler, false);
	canvas.addEventListener('mousewheel', zoomHandler, false);

	canvas.oncontextmenu = function (e)
	{
		closeFSMmenu();
		
		if (fsm.focus.length > 0) {
			var x = transformXY(fsm, e).x;
			var y = transformXY(fsm, e).y;
			fsm.unselectDrag(x, y);

			var node = null;
			var edge = null;
			for (var i = 0; i < fsm.focus.length; i++) {
				if (isNode(fsm.focus[i]))
					node = fsm.focus[i];
				else
					edge = fsm.focus[i];
			}

			var menuX = 50;
			var menuY = -20;
			// Open both menus
			if (openFSMmenu(e.pageX + menuX, e.pageY + menuY, node, edge) == false) {
				var select = fsm.select(x, y);
				if (select != null) {
					if (isNode(select.obj))
						openFSMmenu(e.pageX + menuX, e.pageY + menuY, select.obj, null);
					else
						openFSMmenu(e.pageX + menuX, e.pageY + menuY, null, select.obj);
				}
				else {
					if (isNode(fsm.focus[0]))
						openFSMmenu(e.pageX + menuX, e.pageY + menuY, fsm.focus[0], null);
					else
						openFSMmenu(e.pageX + menuX, e.pageY + menuY, null, fsm.focus[0]);
				}
			}
		}
		return false;	// Cancel default menu
	};
	// Hide FSM menu
	window.onclick = function (e) {
		var menu = $('.canvas-menu');
		if (e.which != 3 && !menu.is(e.target) && menu.has(e.target).length === 0) {
			closeFSMmenu();
		}
	};
	$('.canvas-menu').mouseleave(function() { closeFSMmenu(); });
	
	var changeRadius = function () {
		var radius = this.value;
		fsm.applyToFocus(function (obj) { obj.radius = radius; }, isNode);
		$(this).prev('h5').html('Radius: ' + radius);
		fsm.draw();
	};
	$('.radius input').change(changeRadius);
	$('.radius input').on('input', changeRadius);

	var changeColor = function (filter) {
		var color = colorFromVal(this.value);
		fsm.applyToFocus(function (obj) { obj.color = color; obj.displayColor = color; }, filter);
		$(this).prev('h5').html('Color: ' + color);
		fsm.draw();
	};
	$('#node-menu .color input').change(function () { changeColor.call(this, isNode); });
	$('#node-menu .color input').on('input', function () { changeColor.call(this, isNode); });
	$('#edge-menu .color input').change(function () { changeColor.call(this, isEdge); });
	$('#edge-menu .color input').on('input', function () { changeColor.call(this, isEdge); });

	var changeTextColor = function (filter) {
		var color = colorFromVal(this.value);
		fsm.applyToFocus(function (obj) { obj.textColor = color; obj.textDisplayColor = color; }, filter);
		$(this).prev('h5').html('Text Color: ' + color);
		fsm.draw();
	};
	$('#node-menu .text-color input').change(function () { changeTextColor.call(this, isNode); });
	$('#node-menu .text-color input').on('input', function () { changeTextColor.call(this, isNode); });
	$('#edge-menu .text-color input').change(function () { changeTextColor.call(this, isEdge); });
	$('#edge-menu .text-color input').on('input', function () { changeTextColor.call(this, isEdge); });

	var changeFill = function () {
		var fill = 'none';
		if (this.value < 8)
			fill = colorFromVal(this.value);
		fsm.applyToFocus(function (obj) { obj.fill = fill; }, isNode);
		$(this).prev('h5').html('Fill Color: ' + fill);
		fsm.draw();
	};
	$('.fill input').change(changeFill);
	$('.fill input').on('input', changeFill);
	
	var changeFont = function (filter) {
		var fontSize = this.value;
		fsm.applyToFocus(function (obj) { obj.fontSize = fontSize; }, filter);
		$(this).prev('h5').html('Font Size: ' + fontSize);
		fsm.draw();
	};
	$('#node-menu .font input').change(function () { changeFont.call(this, isNode); });
	$('#node-menu .font input').on('input', function () { changeFont.call(this, isNode); });
	$('#edge-menu .font input').change(function () { changeFont.call(this, isEdge); });
	$('#edge-menu .font input').on('input', function () { changeFont.call(this, isEdge); });
	
	var changeArrow = function () {
		var value = this.value;
		var text = 'none';
		if (value == 1)
			text = 'forward';
		else if (value == 2)
			text = 'backward';
		else if (value == 3)
			text = 'both';
		fsm.applyToFocus(function (obj) {
			if (value == 1 || value == 3)
				obj.endArrow = true;
			else
				obj.endArrow = false;
			if (value == 2 || value == 3)
				obj.startArrow = true;
			else
				obj.startArrow = false;
		}, isEdge);
		$(this).prev('h5').html('Arrows: ' + text);
		fsm.draw();
	};
	$('.arrow input').change(changeArrow);
	$('.arrow input').on('input', changeArrow);
  //Convert to latex -------------------------------

  //User clicks convert
  var button = document.getElementById("latex");
  button.addEventListener("click",function(){
    var latex = new ExportAsLatex(fsm.edges, fsm.nodes);
    console.log(latex);
    $('#textarea').val(latex.toLatex());
    $('#textarea').show(); 
  })
};


addLoadEvent(newOnload);

function transformXY(fsm, e) {
	return {
		x: (e.offsetX - fsm.left) / fsm.scale,
		y: (e.offsetY - fsm.top) / fsm.scale
	};
}

function openNodeMenu(node) {
	$('#node-menu').css('display', 'flex');
	
	$('.radius input').attr('value', node.radius);
	$('.radius input').attr('defaultValue', node.radius);
	$('.radius h5').html('Radius: ' + node.radius);

	$('#node-menu .color input').attr('value', valFromColor(node.color));
	$('#node-menu .color input').attr('defaultValue', valFromColor(node.color));
	$('#node-menu .color h5').html('Color: ' + node.color);

	var fill = 'none';
	if (valFromColor(node.fill) < 8)
		fill = colorFromVal(valFromColor(node.fill));
	$('.fill input').attr('value', valFromColor(node.fill));
	$('.fill input').attr('defaultValue', valFromColor(node.fill));
	$('.fill h5').html('Fill Color: ' + fill);

	$('#node-menu .text-color input').attr('value', valFromColor(node.textColor));
	$('#node-menu .text-color input').attr('defaultValue', valFromColor(node.textColor));
	$('#node-menu .text-color h5').html('Text Color: ' + node.textColor);
	
	$('#node-menu .font input').attr('value', node.fontSize);
	$('#node-menu .font input').attr('defaultValue', node.fontSize);
	$('#node-menu .font h5').html('Font Size: ' + node.fontSize);
}

function openEdgeMenu(edge) {
	$('#edge-menu').css('display', 'flex');

	$('#edge-menu .color input').attr('value', valFromColor(edge.color));
	$('#edge-menu .color input').attr('defaultValue', valFromColor(edge.color));
	$('#edge-menu .color h5').html('Color: ' + edge.color);

	$('#edge-menu .text-color input').attr('value', valFromColor(edge.textColor));
	$('#edge-menu .text-color input').attr('defaultValue', valFromColor(edge.textColor));
	$('#edge-menu .text-color h5').html('Text Color: ' + edge.textColor);
	
	$('#edge-menu .font input').attr('value', edge.fontSize);
	$('#edge-menu .font input').attr('defaultValue', edge.fontSize);
	$('#edge-menu .font h5').html('Font Size: ' + edge.fontSize);

	var arrow = 0;
	var arrowText = 'none'
	if (edge.endArrow == true && edge.startArrow == false) {
		arrow = 1;
		arrowText = 'forward';
	}
	else if (edge.endArrow == false && edge.startArrow == true) {
		arrow = 2;
		arrowText = 'backward';
	}
	if (edge.endArrow == true && edge.startArrow == true) {
		arrow = 3;
		arrowText = 'both';
	}
	$('.arrow input').attr('value', edge.arrow);
	$('.arrow input').attr('defaultValue', edge.arrow);
	$('.arrow h5').html('Arrows: ' + arrowText);
}

function openFSMmenu(x, y, node, edge) {
	if (node != null)
		openNodeMenu(node);
	if (edge != null)
		openEdgeMenu(edge);
	if (node != null || edge != null) {
		// Display separator if both menus open
		if (node != null && edge != null)
			$('.canvas-menu .separator').css('display', 'inline');

		$('.canvas-menu').css('left', x).css('top', y).css('display', 'flex');
		return true;
	}
	return false;
}
function closeFSMmenu() {
	$('.canvas-menu').css('display', 'none');
	$('#node-menu').css('display', 'none');
	$('.canvas-menu .separator').css('display', 'none');
	$('#edge-menu').css('display', 'none');
}
