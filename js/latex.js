//Original Source from  https://github.com/evanw/fsm/blob/master/src/export_as/latex.js
//Iterates through all objects and outputs proper latex commands to draw the object 
// draw using this instead of a canvas and call toLaTeX() afterward
function ExportAsLatex(edges,nodes) {
  this.edges = edges;
  this.nodes = nodes; 
	this.texData = '';
	this.scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

  
  this.createData = function(){
      for (var i = 0; i < this.edges.length; i++) {
          edge = this.edges[i];
          this.texData += edge.toLatex();
      }
      for (var i = 0; i < this.nodes.length; i++) {
          node = this.nodes[i];
          this.texData += node.toLatex(); 
      }
  }

	this.toLatex = function() {
    this.createData();
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.2]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this.texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	};



}
