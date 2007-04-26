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
	- refactor action effects (make effects customizable)
	- manage minimized windows with window manager
	- ghost_drag option
	- window shade and popup menu
	- more themes
	- cascade window positioning
*/

/*
Class: Windoo
	Draggable and resizable window class.

Arguments:
	options - The options object.

Options:
	title - optional, window title;
	width - required, int, window width in pixels (including window border);
	height - required, int, window height in pixels (including window border);
	position - optional, window position method (one of false, 'center', 'cascade': TODO). if false, top and left options define window coordinates. defaults to 'center';
	top - optional, int, top window coordinate;
	left - optional, int, left window coordinate;
	type - optional, window content type. one of 'dom', 'iframe'. defaults to 'dom';
	url - optional, source URL for 'iframe' and 'ajax' window types to load at start;
	resizable - boolean, defines if the window is resizable. defaults to true;
	draggable - boolean, defines if the window is draggable. defaults to true;
	resizeLimit - optional, window resize limits (see Drag.Resize::limit option);
	container - optional, window container element, should have position relative or absolute. defaults to document.body;
	ghost - object, see Ghost below;
	snap - object, see Snap below;
	theme - optional, defines window theme (see Windoo.Themes). defaults to 'windoo';
	shadow - optional, if false turns off window shadow event if such is defined in theme. defaults to true;
	modal - boolean, TODO, defines if the window is modal. defaults to false;
	buttons - object, see Buttons below;
	class - opional, additional custom window element class name;
	wm - optional, defines window manager (see Windoo.Manager) to attach window to;
	effects - object, see Effects below;

Ghost:
	resize - boolean, ghost resiaing. defaults to false;
	move - boolean, ghost moving. defaults to false;

Snap:
	resize - see <Drag.Resize> span option;
	move - see <Drag.Move> span option;

Buttons:
	menu - display window control menu button (see <Buttons display values> below). defaults to false;
	close - display close window control button (see <Buttons display values> below). defaults to true;
	shade - display shade window control button (see <Buttons display values> below). defaults to false;
	minimize - display minimize window control button (see <Buttons display values> below). defaults to true;
	maximize - display maximize window control button (see <Buttons display values> below). defaults to true;

Buttons display values:
	true - display button
	false - do not create buttons
	'diabled' - display inactive button

Effects:
	close - ?
	hide - ?
	show - ?

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
		type: 'dom',
		url: false,
		title: 'Windoo!',
		width: 300,
		height: 200,
		position: 'center',
		top: 0,
		left: 0,
		resizable: true,
		draggable: true,
		resizeLimit: {'x': [0], 'y': [0]},
		ghost: {'resize': false, 'drag': false},
		snap: {'resize': 6, 'drag': 6},
		container: null,
		theme: 'alphacube',
		shadow: true,
		modal: false,
		buttons: {
			menu: false,
			close: true,
			shade: false,
			minimize: true,
			maximize: true
		},
		'class': '',
		wm: false,
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
		var self = this;
		this.fx = {};
		this.bound = {};
		this.zIndex = 0;

		this.options.id = 'windoo-' + (new Date().getTime());
		this.setOptions(options);
		var theme = this.theme = $type(this.options.theme) == 'string' ? Windoo.Themes[this.options.theme] : this.options.theme;
		this.options.container = $(this.options.container || document.body);

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
		internal, construct DOM structure of the window
	*/

	buildDOM: function(){
		var theme = this.theme, _p = theme.classPrefix;
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

		var $row = function(prefix, contentClass){
			return '<div class="' + prefix + '-left ' + _p + '-drag"><div class="' + prefix + '-right"><div class="' + contentClass + '"></div></div></div>';
		};
		var iefix = window.ie && this.options.type != 'iframe',
			body = iefix ? '<table style="border-collapse:collapse;padding:0;cell-padding:0;"><tr><td></td></tr></table>' : '';
		this.innerContent = '<div class="' + _p + '-frame">' + $row("top", "title") + $row("bot", "strut") + '</div>'
			+ '<div class="' + _p + '-body">' + body + '</div>';
		this.el.setHTML(this.innerContent).inject(this.options.container);
		if(window.ie) this.el.addClass(_p + '-' + theme.name + '-ie');

		this.dom = {
			frame: this.el.getFirst(),
			body: this.el.getLast()
		};
		$extend(this.dom, {
			title: this.dom.frame.getElement('.title'),
			strut: this.dom.frame.getElement('.strut'),
			content: iefix ? this.dom.body.getElement('td') : this.dom.body
		});
		this.dom.title.addEvent('dblclick', this.maximize.bind(this));

		if (this.options.type == 'iframe'){
			this.dom.iframe = new Element('iframe', {
				'frameborder': '0',
				'class': _p + '-body',
				'styles': {'width': '100%', 'height': '100%'}
			});
			this.dom.body.setStyle('overflow','hidden');
			this.adopt(this.dom.iframe).setURL(this.options.url);
		}
		return this.buildShadow().buildButtons();
	},

	/*
	Property: buildButtons
		internal, construct DOM structure of the window buttons
	*/

	buildButtons: function(){
		var self = this, buttons = this.options.buttons, _p = this.theme.classPrefix;
		var action = function(name, bind){
			return function(ev){
				new Event(ev).stop();
				(bind[name])();
			};
		};
		this.bound.noaction = function(ev){ new Event(ev).stop(); };
		var makeButton = function(opt, name, title, action){
			self.bound[name] = action;
			if (opt){
				var klass = _p + '-button ' + _p + '-' + name + ( opt == 'disabled' ? ' ' + _p + '-' + name + '-disabled' : "" );
				self.dom[name] = new Element('a', {'class': klass, 'href': '#', 'title': title}).setHTML('x').inject(self.el);
				self.dom[name].addEvent('click', opt == 'disabled' ? self.bound.noaction : action);
			}
		};
		makeButton(buttons.close, 'close', 'Close', action('close', this));
		makeButton(buttons.maximize, 'maximize', 'Maximize', action('maximize', this));
		makeButton(buttons.minimize, 'minimize', 'Minimize', action('minimize', this));
		makeButton(buttons.minimize, 'restore', 'Restore', action('minimize', this));
		makeButton(buttons.shade, 'shade', 'Shade', action('shade', this));
		makeButton(buttons.menu, 'menu', 'Menu', action('menu', this));
		return this;
	},

	/*
	Property: buildShadow
		internal, construct window shadow element
	*/

	buildShadow: function(){
		var theme = this.theme;
		if (!theme.shadow || !this.options.shadow) return this;
		this.shadow = new Element('div', {
			'styles': {'display': 'none'},
			'class': theme.classPrefix + '-shadow-' + theme.shadow
		}).injectAfter(this.el);
		if (theme.shadow == 'image'){
			var $row = function(name){
				var els = ['l','r','m'].map(function(e){ return new Element('div', {'class': e}); });
				var el = new Element('div', {'class': name});
				return el.adopt.apply(el, els);
			};
			this.shadow.adopt($row('top'), $row('bot'));
		}
		return this;
	},

	/*
	Property: makeResizable
		internal, add resizable effect to the window (see <Drag.Resize>)
	*/

	makeResizable: function(){
		var self = this, theme = this.theme, opt = this.options;
		this.fx.resize = this.el.makeResizable({
			ghostClass: theme.ghostClass,
			hoverClass: theme.hoverClass,
			classPrefix: theme.classPrefix + '-sizer ' + theme.classPrefix + '-',
			shadeBackground: theme.shadeBackground,

			container: opt.container,
			resizeLimit: opt.resizeLimit,
			ghost: opt.ghost.resize,
			snap: opt.snap.resize,

			onBeforeStart: function(){
				self.fireEvent('onBeforeResize', this).focus();
			},
			onStart: function(fx){
				if (self.maximized) fx.stop();
				else self.fireEvent('onStartResize', this);
			},
			onResize: function(){
				if (!self.options.ghost.resize) self.fix();
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

	/*
	Property: makeDraggable
		internal, add drag effect to the window (see <Drag.Move>)
	*/

	makeDraggable: function(){
		var self = this, fx = this.fx.drag = [];
		var opts = {
			container: this.options.container,
			snap: this.options.snap.drag,
			onBeforeStart: function(){
				this.shade = window.shade({ styles:{
					'cursor': this.options.handle.getStyle('cursor'),
					'background': self.theme.shadeBackground,
					'z-index': 1000
				}});
				self.fireEvent('onBeforeDrag', this).focus();
			},
			onStart: function(){
				if (self.maximized) this.stop();
				else self.fireEvent('onStartDrag', this);
			},
			onDrag: function(){
				if (!self.options.ghost.drag) self.fix();
				self.fireEvent('onDrag', this);
			},
			onComplete: function(){
				this.shade.remove();
				self.fix().fireEvent('onDragComplete', this);
			}
		};
		this.el.getElements('.' + this.theme.classPrefix + '-drag').each(function(d){
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
			el.setStyles({'visibility': 'visible', 'display': 'block'});
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
		if (this.shadow) this.shadow.setStyle('display', 'none');
		return this.effect('hide', noeffect, function(){
			this.el.setStyle('visibility', 'hidden');
			this.fix(true).fireEvent('onHide');
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
		internal, update window overlay and shadow
	*/

	fix: function(hide){
		this.el.fixOverlay(hide);
		return this.fixShadow(hide);
	},

	/*
	Property: fixShadow
		internal, update shadow position and visibility according to the current window state
	*/

	fixShadow: function(hide){
		if (this.shadow){
			if (hide){
				this.shadow.setStyle('display', 'none');
			} else if (!this.maximized){
				var pos = this.el.getCoordinates(), pad = this.theme.shadowDisplace;
				this.shadow.setStyles({'display': '', 'z-index': '' + (this.zIndex - 1),
					'left': this.el.offsetLeft + pad.left, 'top': this.el.offsetTop + pad.top,
					'width': pos.width + pad.width, 'height': pos.height + pad.height});
			}
		}
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
		var outer = this.el.getCoordinates(), cont = this.options.container.getCoordinates();
		outer.top -= cont.top;
		outer.right -= cont.left;
		outer.bottom -= cont.top;
		outer.left -= cont.left;
		return {
			outer: outer,
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
		var padding = this.theme.padding;
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
		if (this.shadow) this.shadow.setStyle('display', 'none');
		return this.effect('close', noeffect, function(){
			this.fireEvent('onClose');
			this.wm.unregister(this);
			if (this.shadow) this.shadow.empty().remove();
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
		if (this.minimized) return this.minimize();
		var bound = function(value, limit){
			if (!limit) return value;
			if (value < limit[0]) return limit[0]
			if (limit.length > 1 && value > limit[1]) return limit[1];
			return value;
		};
		var klass = [this.theme.classPrefix, this.theme.name, 'maximized'].join('-')
			+ ' ' + this.theme.classPrefix + '-maximized';
		this.maximized = !this.maximized;
		this.minimized = false;
		if (this.maximized){
			this.$restoreMaxi = this.getState();
			var container = this.options.container;
			if (container === document.body) container = window;
			var s = container.getSize(), limit = this.options.resizeLimit;
			if (limit) for (var z in limit) s.size[z] = bound(s.size[z], limit[z]);
			this.setSize(s.size.x, s.size.y).setPosition(s.scroll.x, s.scroll.y);
			this.el.addClass(klass);
			this.fireEvent('onMaximize');
		} else {
			this.el.removeClass(klass);
			this.restoreState(this.$restoreMaxi).fireEvent('onRestore', 'maximize');
		}
		return this.fix(this.maximized);
	},

	/*
	Property: minimize
		Toggle minimized window state (FIXME: add WM layout for minimized windows)

	Arguments:
		noeffect - optional, if true, toggle window state immediately without effect
	*/

	minimize: function(noeffect){
		var klass = [this.theme.classPrefix, this.theme.name, 'minimized'].join('-')
			+ ' ' + this.theme.classPrefix + '-minimized';
		this.minimized = !this.minimized;
		if (this.minimized){
			this.$restoreMini = this.getState();
			var container = this.options.container;
			if (container === document.body) container = window;
			var s = container.getSize(), pad = this.theme.padding, height = pad[0] + pad[2];
			this.setSize('auto', height).setPosition(s.scroll.x + 10, s.scroll.y + s.size.y - height - 10);
			this.el.addClass(klass);
			this.fireEvent('onRestore', 'minimize');
		} else {
			this.el.removeClass(klass);
			this.restoreState(this.$restoreMini).fireEvent('onMinimize');
		}
		return this.fix();
	},

	restoreState: function(state){
		state = state.outer;
		return this.setSize(state.width, state.height).setPosition(state.left, state.top);
	},

	/*
	Property: shade
		TODO, toggle shaded window state

	Arguments:
		noeffect - optional, if true, toggle window state immediately without effect
	*/

	shade: function(noeffect){
		this.fireEvent('onShade');
		return this.fix();
	},

	/*
	Property: openmenu
		TODO, toggle window popup menu
	*/

	openmenu: function(){
		this.fireEvent('onMenu');
		return this;
	},

	/*
	Property: setZIndex
		internal, set window z-index

	Arguments:
		z - z-index value
	*/

	setZIndex: function(z){
		this.zIndex = z;
		this.el.setStyle('zIndex', z);
		if (this.el.fixOverlayElement) $(this.el.fixOverlayElement).setStyle('zIndex', z - 1);
		if (this.shadow) this.shadow.setStyle('zIndex', z - 1);
		if (this.fx.resize) this.fx.resize.options.zIndex = z + 1;
		return this;
	},

	/*
	Property: focus
		Bring focus to the window
	*/

	focus: function(){
		this.el.removeClass(this.theme.classPrefix + '-blur');
		this.wm.focus(this);
		return this;
	},

	/*
	Property: blur
		Remove focus from the window (if focused)
	*/

	blur: function(){
		this.el.addClass(this.theme.classPrefix + '-blur');
		if (this.wm.blur(this)) this.fireEvent('onBlur');
		return this;
	},

	/*
	Property: bringTop
		Put window on top of others
	*/

	bringTop: function(){
		this.setZIndex(this.wm.maxZIndex());
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
		internal, register new window in the manager
	*/

	register: function(win){
		win.setZIndex(this.maxZIndex());
		this.hash.push(win);
		return this.fireEvent('onRegister', win);
	},

	/*
	Property: unregister
		internal, unregister window
	*/

	unregister: function(win){
		this.hash.remove(win);
		return this.fireEvent('onUnregister', win);
	},

	/*
	Property: focus
		internal, set focus to the window

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
		internal, remove focus from the window if focused. Returns true if focus is removed

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

	/*
	Property: cssPath
		Path to default theme CSS directory
	*/

	cssPath: '/css/',

	/*
	Property: cssPath
		Firefox/Mac-specific CSS file name
	*/

	ffMacCss: 'ffmac.css',

	/*
	Property: aero
		Modified 'aero' theme from YUI-Ext library <http://extjs.com/>
	*/

	aero: {
		'name': 'aero',
		'padding': [28, 7, 30, 7],
		'resizeLimit': {'x': [175], 'y': [58]},
		'className': 'windoo windoo-aero',
		'sizerClass': 'sizer',
		'classPrefix': 'windoo',
		'ghostClass': 'windoo-ghost windoo-aero-ghost windoo-hover',
		'hoverClass': 'windoo-hover',
		'shadow': 'simple window-aero-shadow-simple',
		'shadeBackground': 'transparent url(windoo/s.gif)',
		'shadowDisplace': {'left': 3, 'top': 3, 'width': 0, 'height': 0}
	},

	/*
	Property: alphacube
		Modified Alphacube-color theme; For the original theme see <http://art.gnome.org/themes/metacity/1171>
	*/

	alphacube: {
		'name': 'alphacube',
		'padding': [22, 10, 15, 10],
		'resizeLimit': {'x': [275], 'y': [37]},
		'className': 'windoo windoo-alphacube',
		'sizerClass': 'sizer',
		'classPrefix': 'windoo',
		'ghostClass': 'windoo-ghost windoo-alphacube-ghost windoo-hover',
		'hoverClass': 'windoo-hover',
		'shadow': 'simple window-alphacube-shadow-simple',
		'shadeBackground': 'transparent url(windoo/s.gif)',
		'shadowDisplace': {'left': 3, 'top': 3, 'width': 0, 'height': 0}
	}
};

// FF/Mac overlapping scrollbar fix
if (window.gecko && navigator.appVersion.indexOf('acintosh') >= 0) window.addEvent('domready', function(){ new Asset.css(Windoo.Themes.cssPath + Windoo.Themes.ffMacCss); });
