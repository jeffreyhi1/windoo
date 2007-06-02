
var Download = {

	start: function(){
		var compSlide = new Fx.Slide('compression', {duration: 500, transition: Fx.Transitions.quadOut, wait: false}).hide();
		$('compression-tog').addEvent('click', function(ev){
			new Event(ev).stop();
			compSlide.toggle();
		});

		Download.componentElements = $$('#components input');
		Download.compression = $$('#compression div.option');

		Download.components = {};
		Download.componentElements.each(function(el){
			var comp = Download.components[el.value] = {
				deps: el.getProperty('rel').split(','),
				el: el,
				line: el.getParent().getParent(),
				name: el.value,
				selected: false
			};
			comp.fx = new Fx.Styles(comp.line, {wait: false, duration: 300});
			comp.line.addEvent('click', function(ev){
				new Event(ev).stop();
				Download[comp.selected ? 'deselect' : 'select'](el.value);
			});
		}, Download);

		var comp;
		for (var z in Download.components){
			comp = Download.components[z];
			if (comp.el.checked) Download.select(z);
		}
		Download.select("Windoo.Core");
	},

	select: function(name){
		var comp = Download.components[name];
		if ($type(comp) != 'object' || comp.selected) return;

		comp.selected = true;
		comp.fx.start({
			'background-color': '#300',
			'color': '#FF9'
		});

		comp.line.addClass('selected');
		comp.el.checked = 'checked';
		comp.deps.each(function(c){ Download.select(c); });
	},

	deselect: function(name){
		var comp = Download.components[name], other;
		if ($type(comp) != 'object') return;

		comp.selected = false;
		comp.fx.start({
			'background-color': '#000',
			'color': '#EEE'
		});

		comp.line.removeClass('selected');
		comp.el.checked = null;
		for (var z in Download.components){
			other = Download.components[z];
			if (other.name == name || $type(other) != 'object') continue;
			if (other.selected && other.deps.contains(name))
				Download.deselect(other.name);
		}
	},

	all: function(){
		for (var z in Download.components) Download.select(z);
	},

	none: function(){
		for (var z in Download.components) Download.deselect(z);
	}

};

window.addEvent('domready', Download.start);
