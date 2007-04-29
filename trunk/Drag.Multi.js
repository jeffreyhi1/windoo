/*
Script: Drag.Multi.js
	Mootools Drag.Base class extension which adds support for modifying multiple css properties of different elements simultaneously.
	Contains <Drag.Multi>.

License:
	MIT-style license.

Copyright:
	copyright (c) 2007 Yevgen Gorshkov
*/

// internal, the default Drag.Transition linear function and it's inverse

Drag.Transition = {
	linear:{
		step: function(start, current, direction){
			return direction * current - start;
		},
		inverse: function(start, current, direction){
			return (start + current) / direction;
		}
	}
};

/*
Class: Drag.Multi
	Modify multiple css properties of multiple elements based on the position of the mouse.

Arguments:
	options - The options object.

Options:
	handle - required, the $(element) to act as the handle for the draggable elements.
	onStart - optional, function to execute when the user starts to drag (on mousedown);
	onBeforeStart - optional, function to execute when the user starts to drag (on mousedown) but before initial properties values are calculated;
	onComplete - optional, function to execute when the user completes the drag.
	onSnap - optional, function to execute when the distance between staring point and current mouse position exceeds snap option value
	onDrag - optional, function to execute at every step of the drag
	snap - optional, the distance you have to drag before the element starts to respond to the drag. defaults to false

Example:
	(start code)
	var drag = new Drag.Multi({
		handle: $('handle'),
		
		onBeforeStart: function(){
			var size = $(document.body).getSize().scrollSize;
			this.shade = new Element('div', {
				styles: {
					position: "absolute",
					top: 0,
					left: 0,
					width: size.x,
					height: size.y,
					cursor: 'move',
					'z-index': 100
				}
			}).inject(document.body);
		},

		onStart: function(){
			$each(arguments, function(el){
				el.addClass("ondrag");
			});
		},

		onComplete: function(){
			this.shade.remove();
			$each(arguments, function(el){
				el.removeClass("ondrag");
			});
		}

	});

	drag.add($('object'), {
		limit: { y:[0, 198], x:[0,440] },
		modifiers: { x: "margin-left", y: "margin-top" }
	})	
	(end)
*/

Drag.Multi = Drag.Base.extend({

	options: {
		unit: 'px',
		handle: false,
		onStart: Class.empty,
		onBeforeStart: Class.empty,
		onComplete: Class.empty,
		onDrag: Class.empty,
		snap: 6
	},

	elementOptions: {
		direction: {'x': 1, 'y': 1},
		limit: false,
		grid: false,
		bind: false,
		fn: {'x': null, 'y': null}
	},

	initialize: function(options){
		this.setOptions(options);
		this.handle = $(this.options.handle);
		this.mouse = {'start': {}, 'now': {}};
		this.modifiers = {};
		this.element = [];
		this.bound = {
			'start': this.start.bindWithEvent(this),
			'check': this.check.bindWithEvent(this),
			'drag': this.drag.bindWithEvent(this),
			'stop': this.stop.bind(this)
		};
		this.attach();
		if (this.options.initialize) this.options.initialize.call(this);
	},

	/*
	Property: add
		Add element to modify its css properties based on the position of the mouse.
		Returns Bind object (see Options below) to use as bind option for other obects and properties.

	Arguments:
		el - the $(element) to apply the transformations to.

	Options:
		modifiers - an object. see Modifiers below.
		direction - an object. see Direction below.
		limit - an object, see Limit below.
		bind - an object, see Bind below.
		fn - and object, see Transition function below.
		grid - optional, distance in px for snap-to-grid dragging

		modifiers:
			x - string, the style you want to modify when the mouse moves in an horizontal direction. defaults to 'left'
			y - string, the style you want to modify when the mouse moves in a vertical direction. defaults to 'top'

		limit:
			x - array with start and end limit relative to modifiers.x
			y - array with start and end limit relative to modifiers.y

		bind:
			x, y - optional, Bind object. if set change $(element) modifier value according to changes in Bind object

		fn:
			x, y - objects with two properties: direct and inverse functions:
				(start code)
				{
					step: function(start, current, direction){
						return direction * current - start;
					},
					inverse: function(start, current, direction){
						return (start + current) / direction;
					}
				}
				(end code)

	*/

	add: function(el, options){
		var result = {};
		options = $merge(this.elementOptions, options);
		el = $(el);
		if ($type(options.grid) == 'number') options.grid = {'x': options.grid, 'y': options.grid};
		if ($type(options.fn) == 'function') options.fn = {'x': options.fn, 'y': options.fn};

		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			if (!$defined(this.modifiers[z])) this.modifiers[z] = [];
			var opts = {
				modifier: z,
				element: el,
				unit: $pick(options.unit, this.options.unit),
				style: options.modifiers[z],
				direction: options.direction[z],
				baseLimit: options.limit[z],
				grid: options.grid[z],
				bind: $pick(options.bind[z], options.bind),
				fn: $pick(options.fn[z], Drag.Transition.linear)
			};
			if (opts.bind) opts.bind.binded = true;
			
			var sign = opts.style.slice(0,1);
			if (sign == '-' || sign == '+'){
				opts.direction = (sign + 1).toInt();
				opts.style = opts.style.slice(1);
			}
			
			this.modifiers[z].push(opts);
			result[z] = opts;
		}
		if(!this.element.contains(el)) this.element.push(el);
		return result;
	},

	/*
	Property: remove
		Stop all transformations for the passed element.

	Arguments:
		el - the $(element) to stop transformations for.
	*/

	remove: function(el){
		el = $(el);
		for (var z in this.modifiers){
			this.modifiers[z] = this.modifiers[z].filter(function(e){
				return el != e.element;
			});
		}
		this.element.remove(el);
		return this;
	},

	start: function(event){
		this.fireEvent('onBeforeStart', this.element);
		this.mouse.start = event.page;
		for (var z in this.modifiers){
			var mouse = this.mouse.start[z];
			this.modifiers[z].each(function(mod){
				mod.now = mod.element.getStyle(mod.style).toInt();
				mod.start = mod.fn.step(mod.now, mouse, mod.direction, true);
				mod.limit = [];
				if (mod.baseLimit){
					var limit = mod.baseLimit;
					for (var i = 0; i < 2; i++){
						if ($chk(limit[i])) mod.limit[i] = ($type(limit[i]) == "function") ? limit[i](mod) : limit[i];
					}
				}
			}, this);
		}
		document.addListener('mousemove', this.bound.check);
		document.addListener('mouseup', this.bound.stop);
		this.fireEvent('onStart', this.element);
		event.stop();
	},

	modifierUpdate: function(mod){
		var z = mod.modifier, mouse = this.mouse.now[z];
		mod.out = false;
		mod.now = mod.fn.step(mod.start, mod.bind ? mod.bind.inverse : mouse, mod.direction);
		if (mod.limit && $chk(mod.limit[1]) && (mod.now > mod.limit[1])){
			mod.now = mod.limit[1];
			mod.out = true;
		} else if (mod.limit && $chk(mod.limit[0]) && (mod.now < mod.limit[0])){
			mod.now = mod.limit[0];
			mod.out = true;
		}
		if (mod.grid) mod.now -= ((mod.now + mod.grid/2) % mod.grid) - mod.grid/2;
		if (mod.binded) mod.inverse = mod.fn.inverse(mod.start, mod.now, mod.direction);
	},

	drag: function(event){
		this.mouse.now = event.page;
		for (var z in this.modifiers) this.modifiers[z].each(this.modifierUpdate, this);
		for (var z in this.modifiers) this.modifiers[z].each(function(mod){ mod.element.setStyle(mod.style, mod.now + mod.unit); }, this);
		this.fireEvent('onDrag', this.element);
		event.stop();
	}

});
