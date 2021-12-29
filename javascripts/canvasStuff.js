// shim layer with setTimeout fallback
 window.requestAnimFrame = (function(){
   return  window.requestAnimationFrame       || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame    || 
           window.oRequestAnimationFrame      || 
           window.msRequestAnimationFrame     || 
           function(/* function */ callback, /* DOMElement */ element){
             window.setTimeout(callback, 1000 / 60);
           };
 })();

function deepCopy(obj) {
  if (typeof obj == 'object') {
    if (obj instanceof Array) {
      var l = obj.length;
      var r = new Array(l);
      for (var i = 0; i < l; i++) {
        r[i] = deepCopy(obj[i]);
      }
      return r;
    } else {
      var r = {};
      r.prototype = obj.prototype;
      for (var k in obj) {
        r[k] = deepCopy(obj[k]);
      }
      return r;
    }
  }
  return obj;
}


jQuery(function ($) {
	

	lines = Array();
	drawlines = Array();
	
	function Point(x,y){
		this.x = x;
		this.y = y;
	}

	function Curve(points, width, color, step, instantDraw, speed){
		this.points = points;
		this.endPt = 3;
		this.strokeStyle = color==undefined?'#000':color;
		this.lineWidth = width==undefined?1:width;
		this.t = 0;
		this.step = step==undefined?.01:step;
		this.instant = instantDraw!=undefined?instantDraw:false;
		this.speed = speed==undefined?1:speed;
		this.done = false;
	}
	Curve.prototype.set = function(){
		this.done = false;
		this.endPt = 3;
		this.t = 0;
	}
	
	Curve.prototype.update = function(ctx){
		if (this.t > 1) {
			if( this.endPt == this.points.length-1 ){
				this.done=true;return;
			}else{
				this.endPt++;
				this.t = 0;
			}
		}
		i = this.endPt;
		for ( s=0;s<this.speed;s++){
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = this.strokeStyle;
			ctx.lineWidth = this.lineWidth;
			var ax = ( - this.points[i-3].x + 3 * this.points[i-2].x - 3 * this.points[i-1].x + this.points[i].x) / 6;
			var ay = ( - this.points[i-3].y + 3 * this.points[i-2].y - 3 * this.points[i-1].y + this.points[i].y) / 6;
			var bx = (this.points[i-3].x - 2 * this.points[i-2].x + this.points[i-1].x) / 2;
			var by = (this.points[i-3].y - 2 * this.points[i-2].y + this.points[i-1].y) / 2;
			var cx = ( - this.points[i-3].x + this.points[i-1].x) / 2;
			var cy = ( - this.points[i-3].y + this.points[i-1].y) / 2;
			var dx = (this.points[i-3].x + 4 * this.points[i-2].x + this.points[i-1].x) / 6;
			var dy = (this.points[i-3].y + 4 * this.points[i-2].y + this.points[i-1].y) / 6;
			ctx.moveTo(
			ax * Math.pow(this.t, 3) + bx * Math.pow(this.t, 2) + cx * this.t + dx,
			ay * Math.pow(this.t, 3) + by * Math.pow(this.t, 2) + cy * this.t + dy
			);
			ctx.lineTo(
			ax * Math.pow(this.t + this.step, 3) + bx * Math.pow(this.t + this.step, 2) + cx * (this.t + this.step) + dx,
			ay * Math.pow(this.t + this.step, 3) + by * Math.pow(this.t + this.step, 2) + cy * (this.t + this.step) + dy
			);
			ctx.stroke();
			this.t += this.step;
			ctx.restore();
		}
		if ( this.instant ){this.update(ctx);}
	}
	
		
	if ( !Modernizr.canvas ){
		$('#container').append('<img id="sig" src="/images/sig.png" alt="James Rundquist" />');
	}else{
		canvas = document.createElement("canvas");
		canvas.id = "sig";
		canvas.width = 420;
		canvas.height = 110;
		ctx = canvas.getContext('2d');
		$('#sig-container').append(canvas);
		color = $(canvas).css('color');
		$.ajax({
			url:'/javascripts/sig.pts',
			dataType:'text',
			success: function(ptsSet){
				sets = ptsSet.split("\n");
				for( s in sets ){
					s = parseInt(s);
					dat = $.trim(sets[s]);
					pts = dat.split(" ");
					if ( pts.length == 2 ){
						pts[0] = parseFloat($.trim(pts[0]));
						pts[1] = parseFloat($.trim(pts[1]));
						
						pts[0] = (pts[0] - 340) * .4;
						pts[1] = (pts[1] - 200) * .3;
						if ( [null,0,6,12,17,24,37].indexOf(s) > 0 ){
							lines.push(new Curve(Array(), 3, color, .01, false, 20));
						}
						lines[lines.length-1].points.push(new Point(pts[0],pts[1]));
					}
				}
				requestAnimFrame(draw);
			}
		});
	}
	
	function draw(){
		drawlines = Array();
		drawlines = deepCopy(lines);
		updateLines();
	}
	function undraw(){
		ctx.globalAlpha = 1;
		ctx.fillStyle = '#fff';
		ctx.moveTo(0,0);
		ctx.rect(0,0,canvas.width,canvas.height);
		ctx.fill();
	}
	function updateLines(){
		if ( drawlines[0] !== undefined ){
			drawlines[0].update(ctx);
			if ( drawlines[0].done ) drawlines.shift();
			requestAnimFrame(updateLines);
		}else{
			$('body').removeClass('loading').addClass('fade');
			$('.bar').each(function(){$(this).addClass('animate');});
		}
	}
});


