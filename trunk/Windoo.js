/*
Script: Windoo.js
	Mootools draggable and resizable Window extension.
	Contains <Windoo>, <Windoo.Manager>, <Windoo.Themes>.

License:
	MIT-style license.

Copyright:
	copyright (c) 2007 Yevgen Gorshkov

Note:
	Windoo: windows for the cow people (c) ibolmo

TODO:
	- modals / confirm / alert
	- more themes
	- ajax content
	- refactor action effects (make effects customizable)
	- shade/minimize
	- ghost_drag
*/

/*
Class: Windoo
	Draggable and resizable window class.

Arguments:
	options - The options object.

Options:
	width - required, int, window width in pixels (including window border);
	height - required, int, window height in pixels (including window border);
	top - optional, int, top window coordinate;
	left - optional, int, left window coordinate;
	title - optional, window title;
	resizeLimit - optional, window resize limits (see Drag.Resize::limit option);
	ghost - object, see Ghost below;
	position - optional, window position method (one of 'center', 'cascade' - TODO). if not false top and left options are ignored. default 'center';
	buttons - object, see Buttons below;
	container - optional, window container element. default to parentNode;
	dragContainer - optional, defines window drag container. default container option;
	restrictDrag - boolean, restrict windows drag to the container. default false;
	resizeContainer - optional, defines window resize container. default Options::container;
	restrictResize - boolean, restrict windows resize to the container. default false;
	type - optional, window content type. one of 'dom', 'iframe', 'ajax'. default 'dom';
	modal - boolean, defines if the window is modal. default false;
	resizable - boolean, defines if the window is resizable. default true;
	draggable - boolean, defines if the window is draggable. default true;
	url - optional, source URL for 'iframe' and 'ajax' window types to load at start;
	class - opional, additional custom window element class name;
	theme - optional, defines window theme (see Windoo.Themes). default 'windoo';
	wm - optional, defines window manager (see Windoo.Manager) to attach window to;
	effects - object, see Effects below

Ghost:
	resize - boolean, ghost resiaing. default to false;
	move - boolean, ghost moving. default to false;

Buttons:
	close - display close window control button. default to true;
	shade - display shade window control button. default to false;
	minimize - display minimize window control button. default to true;
	maximize - display maximize window control button. default to true;

Effects:
	close - 
	hide - 
	show - 

Events:
	onFocus - optional, function to execute when window obtains focus;
	onBlur - optional, function to execute when window looses focus;
	onClose - optional, function to execute when window is closed (destroyed);
	onHide - optional, function to execute when window is hidden;
	onShow - optional, function to execute when window is shown;
	onMaximize - optional, function to execute when window is maximized;
	onMinimize - optional, function to execute when window is minimized;
	onShade - optional, function to execute when window is shaded;
	onRestore - optional, function to execute when window state is restored. argument contains the previous window state name;
	onBeforeDrag - optional, function to execute when the user starts to drag window but before initial properties values are calculated;
	onStartDrag - optional, function to execute when the user starts to drag the window;
	onDrag - optional, function to execute at every step of the drag;
	onDragComplete - optional, function to execute when the user completes the drag;
	onBeforeResize - optional, function to execute when the user starts to resize window but before initial properties values are calculated;
	onStartResize - optional, function to execute when the user starts to resize the window;
	onResize - optional, function to execute at every resize step;
	onResizeComplete - optional, function to execute when the user completes the resize;

Example:
	(start code)
	new Windoo({
		left: 600,
		top:100,
		title:'Regular window',
		container: $('win1').getParent(),
		position: false
	}).adopt('win1').show();

	// centered iframe window with ghost drag and resize
	new Windoo({
		width:640,
		height:480,
		resizeLimit: {'x':[250], 'y':[200]},
		title:'IFrame window',
		type:'iframe',
		container: false,
		ghost: {resize: true, drag: true},
		url: 'http://mootools.net'
	}).show();
	(end)
*/

var Windoo = new Class({
	options: {
		width: 300,
		height: 200,
		top: 0,
		left: 0,
		title: 'Windoo!',
		resizeLimit: {'x': [0], 'y': [0]},
		ghost: {'resize': false, 'drag': false},
		
		position: 'center',
		buttons: {
			close: true,
			shade: false,
			minimize: true,
			maximize: true
		},
		container: null,
		restrictDrag: false,
		dragContainer: false,
		restrictResize: false,
		resizeContainer: false,

		type: 'dom', // dom, iframe, ajax
		modal: false, //########## TODO
		resizable: true,
		draggable: true,
		
		url: false,

		'class': '',
		theme: 'windoo',
		wm: false, // window manager

		effects: {
			show: {
				options: { duration: 600 },
				styles: { 'opacity': [0,1] }
			},
			close: {
				options: { duration: 600 },
				styles: { 'opacity': [1,0] }
			},
			hide: {
				options: { duration: 600 },
				styles: { 'opacity': [1,0] }
			}
		},

		onFocus: Class.empty,
		onBlur: Class.empty,

		onClose: Class.empty,
		onHide: Class.empty,
		onShow: Class.empty,
		onMaximize: Class.empty,
		onMinimize: Class.empty,
		onShade: Class.empty,
		onRestore: Class.empty,

		onBeforeDrag: Class.empty,
		onStartDrag: Class.empty,
		onDrag: Class.empty,
		onDragComplete: Class.empty,
		onBeforeResize: Class.empty,
		onStartResize: Class.empty,
		onResize: Class.empty,
		onResizeComplete: Class.empty
	},

	initialize: function(options){
		var self=this;
		this.fx={};

		this.options.id = 'windoo-'+(new Date().getTime());
		this.setOptions(options);
		if ($type(this.options.theme) == 'string') this.options.theme = Windoo.Themes[this.options.theme];
		var theme = this.options.theme;

		this.options.container = $(this.options.container || document.body);
		if (this.options.restrictDrag) this.options.dragContainer = this.options.container;
		if (this.options.restrictResize) this.options.resizeContainer = this.options.container;

		['x', 'y'].each(function(z){
			var lim = this.options.resizeLimit;
			if($type(lim[z][0]) == "number")
				lim[z][0] = Math.max(lim[z][0], theme.resizeLimit[z][0])
		}, this);

		this.buildDOM()
			.setSize(this.options.width, this.options.height)
			.setTitle(this.options.title)
			.fix();
		if (this.options.position == 'center') this.positionAtCenter();

		this.minimized = false;
		if(this.options.draggable) this.makeDraggable();
		if(this.options.resizable) this.makeResizable();

		this.wm = this.options.wm || Windoo.$wm;
		this.wm.register(this);
	},

	/*
	Property: buildDOM
		internal. Constructs DOM structure of the window
	*/

	buildDOM: function(){
		var theme = this.options.theme;
		this.el = new Element('div', {
			'id': this.options.id,
			'class': theme.className,
			'styles': {
				'overflow': 'auto',
				'visibility': 'hidden',
				'top': this.options.top,
				'left': this.options.left,
				'zIndex': this.options.zIndex
			},
			'events': {
				'mousedown': this.focus.bind(this)
			}
		});

		if(this.options['class']) this.el.addClass(this.options['class']);

		var $row = function(prefix,contentClass){
			return '<div class="' + prefix + '-left ' + theme.classPrefix + '-drag"><div class="' + prefix + '-right"><div class="' + contentClass + '"></div></div></div>';
		}
		var iefix = window.ie && this.options.type != 'iframe',
			body = iefix ? '<table style="border-collapse:collapse;padding:0;cell-padding:0;"><tr><td></td></tr></table>' : '';
		this.innerContent = '<div class="' + theme.classPrefix + '-frame">' + $row("top", "title") + $row("bot", "strut") + '</div>'
			+ '<div class="' + theme.classPrefix + '-body">' + body + '</div>';
		this.el.setHTML(this.innerContent).inject(this.options.container);
		if(window.ie) this.el.addClass('ie');

		this.dom = {
			frame: this.el.getFirst(),
			body: this.el.getLast()
		};
		$extend(this.dom, {
			title: this.dom.frame.getElement('.title'),
			strut: this.dom.frame.getElement('.strut'),
			content: iefix ? this.dom.body.getElement('td') : this.dom.body
		});

		if (this.options.type == 'iframe'){
			this.dom.iframe = new Element('iframe', {
				'frameborder': '0',
				'class': theme.classPrefix + '-body',
				'styles': {'width':'100%', 'height':'100%'}
			});
			this.dom.body.setStyle('overflow','hidden');
			this.adopt(this.dom.iframe).setURL(this.options.url);
		}
		return this.buildButtons();
	},

	/*
	Property: buildButtons
		internal. Constructs DOM structure of the window buttons
	*/

	buildButtons: function(){
		var self = this, buttons = this.options.buttons, theme = this.options.theme;
		var btnClass = theme.classPrefix + "-button " + theme.classPrefix;

		var action = function(name){ return function(ev){ new Event(ev).stop(); self[name](); }; }
		if(buttons.close)
			this.dom.close = new Element('a', { 'class': btnClass + '-close', href:'#', title:'Close' }).setHTML('x')
				.addEvent('click',action('close')).inject(this.el);
		if(buttons.maximize)
			this.dom.maximize = new Element('a', { 'class': btnClass + '-maximize', href:'#', title:'Maximize' }).setHTML('O')
				.addEvent('click',action('maximize')).inject(this.el);
		if(buttons.minimize)
			this.dom.minimize = new Element('a', { 'class': btnClass + '-minimize', href:'#', title:'Minimize' }).setHTML('_')
				.addEvent('click',action('minimize')).inject(this.el);
		if(buttons.shade)
			this.dom.minimize = new Element('a', { 'class': btnClass + '-shade', href:'#', title:'Shade' }).setHTML('-')
				.addEvent('click',action('shade')).inject(this.el);
		return this;
	},

	makeResizable: function(){
		var self = this, theme = this.options.theme;
		this.fx.resize = this.el.makeResizable({
			ghostClass: theme.ghostClass,
			hoverClass: theme.hoverClass,
			classPrefix: theme.classPrefix + '-sizer ' + theme.classPrefix + '-',

			ghost: this.options.ghost.resize,
			resizeLimit: this.options.resizeLimit,
			container: this.options.resizeContainer,

			onBeforeStart: function(){
				self.fireEvent('onBeforeResize', this).focus();
			},
			onStart: function(fx){
				self.fireEvent('onStartResize', this);
				if (self.maximized) fx.stop();
			},
			onResize: function(){
				self.fireEvent('onResize', this);
			},
			onComplete: function(){
				if (this.ghost){
					var size = self.getState().outer;
					self.setSize(size.width, size.height);
				}
				self.fix().fireEvent('onResizeComplete', this);
			},
			onBuild: function(dir, binds){
				if (!binds.y || this.ghost) return;
				var fx = this.fx[dir];

				['strut','body'].each(function(name){
					fx.add(this[name], {
						bind: binds.y,
						direction: {'y': binds.y.y.direction},
						modifiers: {'y': 'height'}
					});
				}, self.dom);
			}
		});
	},

	makeDraggable: function(){
		var self = this, fx = this.fx.drag = [];
		var opts = {
			container: this.options.dragContainer,
			limit: {'x': [0], 'y': [0]},
			onBeforeStart: function(){
				self.fireEvent('onBeforeDrag', this).focus();
			},
			onStart: function(){
				self.fireEvent('onStartDrag', this);
			},
			onDrag: function(){
				self.fix().fireEvent('onDrag', this);
			},
			onComplete: function(){
				self.fireEvent('onDragComplete', this);
			}
		};
		this.el.getElements('.' + this.options.theme.classPrefix + '-drag').each(function(d){
			opts.handle = d;
			fx.push(this.el.makeDraggable(opts));
		}, this);
	},

	/*
	Property: setHTML
		Set window content to a string

	Arguments:
		content - the HTML content string
	*/

	setHTML: function(content){
		this.dom.content.empty().setHTML(content);
		return this;
	},

	/*
	Property: setHTML
		Adopt the element as window content

	Arguments:
		el - the $(el) element
	*/

	adopt: function(el){
		el = $(el);
		this.dom.content.empty()
		if (el){
			if (el.getParent()) el.remove();
			this.dom.content.adopt(el);
		}
		return this;
	},

	/*
	Property: setURL
		Set URL to load into ifram/ajax window

	Arguments:
		url - the url string to load
	*/

	setURL: function(url){
		this.dom.iframe.src=url;
		return this;
	},

	/*
	Property: getContent
		Returns window content element
	*/

	getContent: function(){
		return this.dom.content;
	},

	/*
	Property: setTitle
		Set window title

	Arguments:
		title - the title string
	*/

	setTitle: function(title){
		this.dom.title.setHTML(title || "&nbsp;");
		return this;
	},

	/*
	Property: effect
		Perform an action with registered action effect

	Arguments:
		name - name of an action and effect
		noeffect - if false, perform action without effect
		onComplete - function to execute when the effect is finished
	*/

	effect: function(name, noeffect, onComplete){
		opts = {onComplete: onComplete};
		if (noeffect) opts.duration = 0;
		var fx = this.options.effects[name];
		new Fx.Styles(fx.el || this.el, $merge(fx.options, opts)).start(fx.styles);
		return this;
	},

	/*
	Property: hide
		Hide window

	Arguments:
		noeffect - optional, if true, hide window immediately without effect
	*/

	hide: function(noeffect){
		return this.effect('hide', noeffect, function(){
			this.el.setStyle('visibility', 'hidden').fix(true);
			this.fireEvent('onHide');
		}.bind(this));
	},

	/*
	Property: hide
		Show window

	Arguments:
		noeffect - optional, if true, show window immediately without effect
	*/

	show: function(noeffect){
		this.fireEvent('onShow').bringTop();
		return this.effect('show', noeffect, function(){
			this.el.setStyle('visibility', 'visible');
			this.fix();
		}.bind(this));
	},

	/*
	Property: fix
		Internal. Update window overlay
	*/

	fix: function(hide){
		this.el.fixOverlay(hide);
		return this;
	},

	/*
	Property: getState
		Returns current window State see below

	State:
		outer - outer border coordinates;
		inner - window content size
	*/

	getState: function(){
		return {
			outer: this.el.getCoordinates(),
			inner: this.dom.content.getSize()
		};
	},

	/*
	Property: getState
		Set window size (border size)
	
	Arguments:
		width - int, window width in pixels
		height - int, window height in pixels
	*/

	setSize: function(width, height){
		this.el.setStyles({'width': width, 'height': height});
		var padding = this.options.theme.padding;
		this.dom.strut.setStyle('height', height - padding[0]);
		this.dom.body.setStyle('height', height - padding[0] - padding[2]);
		return this.fix();
	},

	/*
	Property: positionAtCenter
		Make window positioned at the browser window center
	
	Arguments:
		offset - optional, window coordinates Offset object (see below)

	Offset:
		x - int, horizontal offset
		y - int, vertical offset
	*/

	positionAtCenter: function(offset){
		offset = $merge({'x': 0, 'y': 0}, offset);
		var container = this.options.container;
		if (container === document.body) container = window;
		var s = container.getSize(), esize = this.el.getSize().size,
			fn = function(z){ return Math.max(0, offset[z] + s.scroll[z] + (s.size[z] - esize[z])/2); };
		this.el.setStyles({'left': fn('x'), 'top': fn('y')});
		return this.fix();
	},

	/*
	Property: setPosition
		Set window position
	
	Arguments:
		x - int, horizontal coordinate in pixels;
		y - int, certical coordinate in pixels;
	*/

	setPosition: function(x, y){
		this.el.setStyles({'left': x, 'top': y});
		return this.fix();
	},

	/*
	Property: close
		Close (destroy) window

	Arguments:
		noeffect - optional, if true, close window immediately without effect
	*/

	close: function(noeffect){
		return this.effect('close', noeffect, function(){
			this.fireEvent('onClose');
			this.wm.unregister(this);
			if (this.el.fixOverlayElement) $(this.el.fixOverlayElement).remove();
			this.el.empty().remove();
		}.bind(this));
	},

	/*
	Property: maximize
		Toggle maximized window state

	Arguments:
		noeffect - TODO, optional, if true, toggle window state immediately without effect
	*/

	maximize: function(noeffect){
		var bound = function(value, limit){
			if (!limit) return value;
			if (value < limit[0]) return limit[0]
			if (limit.length > 1 && value > limit[1]) return limit[1];
			return value;
		};
		var theme = this.options.theme;
		if (this.maximized){
			var state = this.$restoreState.outer;
			this.el.removeClass(theme.classPrefix + '-maximized');
			this.setSize(state.width, state.height).setPosition(state.left, state.top);
			this.maximized = false;
			this.fireEvent('onRestore', 'maximize');
		} else {
			this.$restoreState = this.getState();
			var container = this.options.container;
			if (container === document.body) container = window;
			var s = container.getSize(), limit = this.options.resizeLimit;
			if (limit) for (var z in limit) s.size[z] = bound(s.size[z], limit[z]);
			this.setSize(s.size.x, s.size.y).setPosition(s.scroll.x, s.scroll.y);
			this.maximized = true;
			this.el.addClass(theme.classPrefix + '-maximized');
			this.fireEvent('onMaximize');
		}
		return this;
	},

	/*
	Property: minimize
		TODO. Toggle minimized window state

	Arguments:
		noeffect - optional, if true, toggle window state immediately without effect
	*/

	minimize: function(noeffect){
		if (!this.minimized){
			/*this.dom.content.oldHeight = this.dom.content.getSize().size.y;
			this.middleTableOldHeight = $('middle_' + this.options.id).getSize().size.y;

			this.dom.content.effect('height').start(0);
			this.el.effect('height').start(48);
			$('middle_' + this.options.id).effect('height').start(0);*/
			this.minimized = true;
			this.fireEvent('onMinimize');
		} else {
			/*this.dom.content.effect('height').start(this.dom.content.oldHeight);
			this.el.effect('height').start(this.options.height);
			$('middle_' + this.options.id).effect('height').start(this.middleTableOldHeight);*/
			this.minimized = false;
			this.fireEvent('onRestore', 'minimize');
		}
		return this.fix();
	},

	/*
	Property: shade
		TODO. Toggle shaded window state

	Arguments:
		noeffect - optional, if true, toggle window state immediately without effect
	*/

	shade: function(noeffect){
		this.fireEvent('onShade');
		return this.fix();
	},

	/*
	Property: setZIndex
		Internal. Set window z-index

	Arguments:
		z - z-index value
	*/

	setZIndex: function(z){
		this.zIndex = z;
		this.el.setStyle('zIndex', z);
		if (this.el.fixOverlayElement) $(this.el.fixOverlayElement).setStyle('zIndex', z - 1);
		if (this.fx.resize) this.fx.resize.options.zIndex = z + 1;
		return this;
	},

	/*
	Property: focus
		Bring focus to the window
	*/

	focus: function(){
		this.el.removeClass(this.options.theme.classPrefix + '-blur');
		this.wm.focus(this);
		return this;
	},

	/*
	Property: blur
		Remove focus from the window (if focused)
	*/

	blur: function(){
		this.el.addClass(this.options.theme.classPrefix + '-blur');
		if (this.wm.blur(this)) this.fireEvent('onBlur');
		return this;
	},

	/*
	Property: bringTop
		Put window on top of others
	*/

	bringTop: function(){
		this.setZIndex(this.wm.maxZIndex());
		/*if (window.gecko && navigator.appVersion.test(/ackintosh/)){
			var p = this.el.getParent(), cc = this.el.clone(true);
			p.adopt(cc);
			this.el.setStyle('visibility','hidden').remove().inject(p).setStyle('visibility','visible');
			cc.remove().empty();
		}*/
		return this;
	},

	/*
	Property: bringBottom
		TODO. Put window on the bottom of the windows stack
	*/

	bringBottom: function(){
		//###############
		alert('TODO - window groups')
		return this;
	}

});
Windoo.implement(new Options);
Windoo.implement(new Events);


/*
Class: Windoo.Manager
	Window manager class.

Options:
	zIndex - Starting window z-index value;
	onRegister - optional, function to execute when window is registered;
	onUnregister - optional, function to execute when window is unregistered;
	onFocus - optional, function to execute when window is focused;
	onBlur - optional, function to execute when window loses focus;
*/

Windoo.Manager = new Class({
	focused: false,
	options: {
		zIndex: 100,
		onRegister: Class.empty,
		onUnregister: Class.empty,
		onFocus: Class.empty,
		onBlur: Class.empty
	},

	initialize: function(options){
		this.hash = [];
		this.setOptions(options);
	},

	/*
	Property: maxZIndex
		Returns maximal z-index value of all windows
	*/

	maxZIndex: function(){
		var windows = this.hash;
		if (!windows.length) return this.options.zIndex;
		var zindex = [];
		windows.each(function(item){ zindex.push(item.zIndex);});
		zindex.sort(function(a, b){ return a - b; });
		return zindex.getLast() + 3;
	},

	/*
	Property: register
		Internal. Register new window in the manager
	*/

	register: function(win){
		win.setZIndex(this.maxZIndex());
		this.hash.push(win);
		return this.fireEvent('onRegister', win);
	},

	/*
	Property: unregister
		Internal. Unregister window
	*/

	unregister: function(win){
		this.hash.remove(win);
		return this.fireEvent('onUnregister', win);
	},

	/*
	Property: focus
		Internal. Focus the window

	Arguments:
		win - window to set as focused
	*/

	focus: function(win){
		var idx = this.hash.indexOf(win);
		if (idx === this.focused) return this;
		if (this.focused) this.focused.blur();
		this.focused = win;
		win.bringTop(this.maxZIndex());
		return this.fireEvent('onFocus', win);
	},

	/*
	Property: blur
		Internal. Remove focus from the window if focused. Returns true if focus is removed

	Arguments:
		win - window to remove focus from
	*/

	blur: function(win){
		if (this.focused === win){
			this.focused = false;
			this.fireEvent('onBlur', win);
			return true;
		}
		return false;
	}

});
Windoo.Manager.implement(new Options);
Windoo.Manager.implement(new Events);

/*
Property: Windoo.$wm
	Default window manager object.
*/

Windoo.$wm = new Windoo.Manager();

/*
Class: Windoo.Themes
	Window themes descriptions.
*/

Windoo.Themes = {
	windoo: {
		'padding': [28, 7, 33, 7],
		'resizeLimit': {'x': [175], 'y': [61]},
		'className': 'windoo',
		'sizerClass': 'sizer',
		'classPrefix': 'windoo',
		'ghostClass': 'windoo-ghost windoo-hover',
		'hiverClass': 'windoo-hover'
	}
};

// FF/Mac overlapping scrollbar fix
if (window.gecko && navigator.appVersion.indexOf('acintosh') >= 0) new Asset.css('/css/ffmac.css');
