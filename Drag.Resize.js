/*
Script: Drag.Resize.js
	Mootools Drag.Resize: 8-way resizable element extension.
	Contains <Drag.Resize>, <Element::makeResizable>.

License:
	MIT-style license.

Copyright:
	copyright (c) 2007 Yevgen Gorshkov

TODO:
	- automatically convert <img> into resiable <div> container
*/

/*
Property: Window.shade
	Create a shade element over all page area with the given properties.

Arguments:
	options - optional, options passed to the Element constructor.
*/

window.shade = function(options){
	var size = this.getSize().scrollSize;
	var shade = new Element('div', $merge({ styles:{
		'position': 'absolute',
		'top': 0,
		'left': 0,
		'width': size.x,
		'height': size.y
	}}, options)).inject(document.body);
	shade.fixOverlay();
	return shade;
};

Drag.Multi.$direction = {
	east: { 'x':1 },
	west: { 'x':-1 },
	north: { 'y':-1 },
	south: { 'y':1 },
	nw: { 'x':-1, 'y':-1 },
	ne: { 'x':1, 'y':-1 },
	sw: { 'x':-1, 'y':1 },
	se: { 'x':1, 'y':1 }
};

/*
Class: Drag.Resize
	Extends <Drag.Base>, has additional functionality for resizing an element into 8 direction.

Arguments:
	el - the $(element) to apply the resize to.
	options - the options object.

Options:
	zIndex - optional, resize shade z-index;
	moveLimit - object, limit for element moving (resize in negative directions), see Limit below;
	resizeLimit - object, limit for element resizing, see Limit below;
	grid - optional, distance in px for snap-to-grid dragging;
	modifiers - an object. see Modifiers below;
	container - an element, will fill automatically limiting options based on the $(element) size and position. if false no limiting is applied. defaults to null (parentNode);
	preserveRatio - boolean, preserve initial element aspect ratio during resize. defaults to false;
	ghost - optional, show wired ghpot element during resize and update the element size and position after resize is completed;
	snap - optional, the distance you have to drag before the element starts to respond to the drag. defaults to 6;
	direction - object, see Direction below;
	limiter - object, see Limiter below;
	moveLimiter - object, see Limiter below;
	ghostClass - optional, wired ghost element class name;
	classPrefix - optional, class name prefix to add to sizer elements;
	hoverClass - optional, class name added to element onmouserover;
	shadeBackground - optional, background CSS property value for resize shade element (contains path to 1x1 px transparent gif image file);

Direction:
	east - east direction: { 'x':1 },
	west - west direction: { 'x':-1 },
	north - north direction: { 'y':-1 },
	south - south direction: { 'y':1 },
	nw - north-west direction: { 'x':-1, 'y':-1 },
	ne - north-east direction: { 'x':1, 'y':-1 },
	sw - south-west direction: { 'x':-1, 'y':1 },
	se - south-east direction: { 'x':1, 'y':1 }

Limiter:
	x - internal; {'-1': ['left', 'right'], '1': ['right', 'left']},
	y - internal; {'-1': ['top', 'bottom'], '1': ['bottom', 'top']}

Events:
	onBuild - optional, function to execute when resize handle is built;
	onBeforeStart - optional, function to execute when the user starts resizing but before initial properties values are calculated;
	onStart - optional, function to execute when the user starts resizing;
	onResize - optional, function to execute at every resize step;
	onComplete - optional, function to execute when the user completes the resize;
*/

Drag.Resize = new Class({
	options:{
		zIndex: 10000,
		moveLimit: false,
		resizeLimit: {'x': [0], 'y': [0]},
		grid: false,
		modifiers: {'x': 'left', 'y': 'top', 'width': 'width', 'height': 'height'},
		container: null, // false == no caintainer, null == container is parentNode
		preserveRatio: false,
		ghost: false,
		snap: 6,
		direction: Drag.Multi.$direction,
		limiter:{
			'x': {'-1': ['left', 'right'], '1': ['right', 'left']},
			'y': {'-1': ['top', 'bottom'], '1': ['bottom', 'top']}
		},
		moveLimiter:{
			'x': ['left', 'right'],
			'y': ['top', 'bottom']
		},
		ghostClass: 'ghost-sizer sizer-visible',
		classPrefix: 'sizer sizer-',
		hoverClass: 'sizer-visible',
		shadeBackground: 'transparent url(s.gif)',

		onBuild: Class.empty,
		onBeforeStart: Class.empty,
		onStart: Class.empty,
		onSnap: Class.empty,
		onResize: Class.empty,
		onComplete: Class.empty
	},

	initialize: function(el, options){
		var self = this;
		this.el = $(el);
		this.fx = {};
		this.setOptions(options);
		this.options.container = this.options.container === null ? this.el.getParent() : $(this.options.container);
		if ($type(this.options.direction) == 'string'){
			if (dir == 'all'){
				this.options.direction = Drag.Multi.$direction;
			} else {
				var dir = this.options.direction.split(/\s+/);
				this.options.direction = {};
				dir.each(function(d){ this[d] = Drag.Multi.$direction[d]; }, this.options.direction);
			}
		}

		var ce = this.el.getCoordinates();
		this.el.setStyles({'width': ce.width, 'height': ce.height});
		if (this.options.container){
			if (this.el.getStyle('position') != 'relative'){
				var cc = this.options.container.getCoordinates();
				this.el.setStyles({'left': ce.left - cc.left, 'top': ce.top - cc.top});
			}
			this.options.moveLimit = $merge({'x': [0], 'y': [0]}, this.options.moveLimit);
		}

		if (this.options.preserveRatio){
			var R = ce.width / ce.height;
			// fix limits according to aspect ratio
			// FIXME how to process dynamic limits???
			// border limits do not work well too...
			var rlim = self.options.resizeLimit;
			var fix = function(z1, z2, op, no, coeff){
				if(rlim && rlim[z1] && rlim[z2] && rlim[z1][no] && rlim[z2][no])
					rlim[z1][no] = Math[op]( rlim[z1][no], coeff * rlim[z2][no] );
			};
			fix('x','y','max',0,R);
			fix('y','x','max',0,1/R);
			fix('x','y','min',1,R);
			fix('y','x','min',1,1/R);
			this.aspectStep = {
				x: {step: function(s, c, d){ return d * c / R - s; }},
				y: {step: function(s, c, d){ return d * c * R - s; }}
			};
			['nw','ne','sw','se'].each(function(z){ delete this[z]; }, this.options.direction);
		}

		if (this.options.ghost){
			this.ghost = new Element('div', {'class': this.options.ghostClass, 'styles': {'display': 'none'}}).injectAfter(this.el);
			for (var d in this.options.direction) this.ghost.adopt(new Element('div', {'class': this.options.classPrefix + d}));
		}

		var rOpts = {
			snap: this.options.snap,
			onBeforeStart: function(){
				self.fireEvent('onBeforeStart', this);
				self.started = true;
				this.shade = window.shade({ styles:{
					'cursor': this.options.handle.getStyle('cursor'),
					'background': self.options.shadeBackground,
					'z-index': self.options.zIndex + 1
				}});

				if (self.ghost){
					var ce = self.el.getCoordinates();
					self.ghost.setStyles({
						'display': 'block',
						'z-index': self.options.zIndex,
						'left': self.el.getStyle('left'),
						'top': self.el.getStyle('top'),
						'width': ce.width,
						'height': ce.height
					});
					for (var z in this.modifiers)
						this.modifiers[z].each(function(mod){
							if (mod.element === self.ghost)
								mod.element.setStyle(mod.style, self.el.getStyle(mod.style));
						});
					if (self.options.hoverClass) self.el.removeClass(self.options.hoverClass);
				}
			},
			onSnap: function(){
				self.fireEvent('onSnap', this);
			},
			onStart: function(){
				self.fireEvent('onStart', this);
			},
			onDrag: function(){
				self.fireEvent('onResize', this);
			},
			onComplete: function(){
				self.started = false;
				if (self.options.hoverClass) self.el.removeClass(self.options.hoverClass);
				this.shade.remove();
				this.shade = null;
				if (self.ghost){
					for (var z in this.modifiers){
						this.modifiers[z].each(function(mod){
							if (mod.element === self.ghost) self.el.setStyle(mod.style, mod.now + mod.unit);
						});
					}
					self.ghost.setStyle('display', 'none');
				}
				self.fireEvent('onComplete', this);
			}
		};

		var rlimitFcn = function(sign, props, limit){
			if (!self.options.container) return limit;
			if (!limit) limit = [0];
			var generator = function(lim){
				return function(mod){
					var cc = self.options.container.getCoordinates(),
						ec = mod.element.getCoordinates();
					var value = sign * (cc[props[0]] - ec[props[1]]);
					switch ($type(lim)){
						case "number": return Math.min(value, lim);
						case "function": return Math.min(value, lim.call(this, mod));
						default: return value;
					}
				};
			};
			return [limit[0], generator(limit[1])];
		};
		var mlimitFcn = function(props, limit, rlimit){
			var container = self.options.container;
			if (!container){
				if (!limit) limit=false;
				container = self.el.getParent();
			} else if (!limit) limit=[0];

			var generator = function(lim, rlim, op, rdef){
				if (!$type(rlim)) rlim = rdef;
				var lim_type = $type(lim);
				if (rlim === null) return lim_type == "function" ? lim : function(){ return lim; };
				return function(mod){
					var cc = container.getCoordinates(),
						ec = mod.element.getCoordinates();
					var value = ec[props[1]] - cc[props[0]] - rlim;
					switch (lim_type){
						case "number": return Math[op](value, lim);
						case "function": return Math[op](value, lim.call(this, mod));
						default: return value;
					}
				};
			};
			return [generator(limit[0],rlimit[1],'max',null), generator(limit[1],rlimit[0],'min',limit[1])];
		};

		var opt = this.options, el = this.ghost ? this.ghost : this.el;
		for (var d in opt.direction){
			var mod = opt.direction[d];
			rOpts.handle = new Element('div', {'class': opt.classPrefix + d}).inject(this.el);
			var drag = this.fx[d] = new Drag.Multi(rOpts);
			var resizeLimit = {
				'x': rlimitFcn(mod.x, opt.limiter.x['' + mod.x], opt.resizeLimit.x),
				'y': rlimitFcn(mod.y, opt.limiter.y['' + mod.y], opt.resizeLimit.y)
			};
			var moveOpts = {
				limit: {
					'x': mlimitFcn(opt.moveLimiter.x, opt.moveLimit.x, opt.resizeLimit.x),
					'y': mlimitFcn(opt.moveLimiter.y, opt.moveLimit.y, opt.resizeLimit.y)
				},
				grid: opt.grid,
				modifiers: {}
			};
			for (var z in mod) if (mod[z] < 0) moveOpts.modifiers[z] = opt.modifiers[z];
			var binds = {move: drag.add(el, moveOpts)};
			if (mod.x != undefined){
				binds.x = drag.add(el, {
					limit: mod.x < 0 ? false : resizeLimit,
					grid: mod.x < 0 ? false : opt.grid,
					bind: mod.x < 0 ? binds.move : false,
					modifiers: {'x': opt.modifiers.width},
					direction: {'x': mod.x}
				});
				if (this.options.preserveRatio)
					binds.xAspect = drag.add(el, {
						bind: binds.x,
						fn: this.aspectStep,
						modifiers: {'x': opt.modifiers.height},
						direction: {'x': mod.x}
					});
			}
			if (mod.y != undefined){
				binds.y = drag.add(el, {
					limit: mod.y < 0 ? false : resizeLimit,
					grid: mod.y < 0 ? false : opt.grid,
					bind: mod.y < 0 ? binds.move : false,
					modifiers: {'y': opt.modifiers.height},
					direction: {'y': mod.y}
				});
				if (this.options.preserveRatio)
					binds.yAspect = drag.add(el, {
						bind: binds.y,
						fn: this.aspectStep,
						modifiers: {'y': opt.modifiers.width},
						direction: {'y': mod.y}
					});
			}
			this.fireEvent('onBuild', [d, binds]);
		}

		if (this.options.hoverClass){
			this.el.addEvent('mouseenter', function(ev){
				this.addClass(self.options.hoverClass);
			});
			this.el.addEvent('mouseleave', function(ev){
				if(!self.started) this.removeClass(self.options.hoverClass);
			});
		}
	}

});
Drag.Resize.implement(new Options);
Drag.Resize.implement(new Events);

/*
Class: Element
	Custom class to allow all of its methods to be used with any DOM element via the dollar function <$>.
*/

Element.extend({

	/*
	Property: fixOverlay
		IE only, create or update overlay element to fix 'IE select bug'.
		From digitarald's extended moo. See <http://dev.digitarald.de/js/moo.dev.extend.js>

	Arguments:
		hide - optional, hide overlay element if true.
	*/

	fixOverlay: function(hide){
		if (!window.ie6) return false;
		if (!this.fixOverlayElement) this.fixOverlayElement = new Element('iframe', {
			'properties': {'frameborder': '0', 'scrolling': 'no', 'src': 'javascript:false;'},
			'styles': {'position': 'absolute', 'border': 'none', 'filter': 'progid:DXImageTransform.Microsoft.Alpha(opacity=0)'}}).injectAfter(this);
		if (hide) return this.fixOverlayElement.setStyle('display', 'none');
		var z = this.getStyle('z-index').toInt() || 0;
		if (z < 1) this.setStyle('z-index', '' + (z = 2) );
		var pos = this.getCoordinates();
		return this.fixOverlayElement.setStyles({'display' : '', 'z-index': '' + (z - 1),
			'left': pos.left + 'px', 'top': pos.top + 'px',
			'width': pos.width + 'px', 'height': pos.height + 'px'});
	},

	/*
	Property: remove
		Removes the Element from the DOM. Also removes overlay element if present.
	*/

	remove: function(){
		if (this.fixOverlayElement) this.fixOverlayElement.remove();
		return this.parentNode.removeChild(this);
	},

	/*
	Property: makeResizable
		Makes an element resizable (by dragging) with the supplied options.

	Arguments:
		options - see <Drag.Resize> and <Drag.Base> for acceptable options. Falls back to <Drag.Base> if handle options set.
	*/

	makeResizable: function(options){
		options = options || {};
		if (options.handle)
			return new Drag.Base(this, $merge({modifiers: {'x': 'width', 'y': 'height'}}, options));
		return new Drag.Resize(this, options);
	}

});