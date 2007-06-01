
var Download = {

	start: function(){
		var compSlide = new Fx.Slide('compression', {duration: 500, transition: Fx.Transitions.quadOut, wait: false}).hide();
		$('compression-tog').addEvent('click', function(e){
			compSlide.toggle();
			new Event(e).stop();
		});

		Download.componentElements = $$('#components input');
		Download.compression = $$('#compression div.option');

		/*Download.fx = [];
		Download.parse();
		[].extend(Download.chks).extend(Download.compression).each(function(chk){
			chk.inputElement = chk.getElement('input');
			chk.inputElement.setStyle('display', 'none');
		});*/

		Download.components = {};
		Download.componentElements.each(function(el){
			var comp = Download.components[el.value] = {
				deps: el.getProperty('rel').split(','),
				el: el,
				line: el.getParent().getParent(),
				name: el.value
			};
			el.setProperty('checked', false);
			el.addEvent('change', function(ev){
				Download[this.checked ? 'select' : 'deselect'](el.value);
			});
		}, Download);
		Download.select(Download.componentElements[0].value);
		//Download.select(Download.radios[0]);
	},

	select: function(name){
		var comp = Download.components[name];
		if ($type(comp) != 'object' || comp.line.hasClass('selected')) return;

		/*Download.fx[chk.index].start({
			'background-color': '#161619',
			'color': '#FFF'
		});*/

		comp.line.addClass('selected');
		comp.el.setProperty('checked', 'checked');
		comp.deps.each(function(c){ Download.select(c); });
	},

	deselect: function(name){
		var comp = Download.components[name], other;
		if ($type(comp) != 'object') return;
/*
		Download.fx[chk.index].start({
			'background-color': '#1d1d20',
			'color': '#595965'
		});
*/
		comp.line.removeClass('selected');
		comp.el.setProperty('checked', false);
		for (var z in Download.components){
			other = Download.components[z];
			if (other.name == name || $type(other) != 'object') continue;
			if (other.deps.contains(name) && other.line.hasClass('selected'))
				Download.deselect(other.name);
		}
	},

	all: function(){
		for (var z in Download.components) Download.select(z);
	},

	none: function(){
		for (var z in Download.components) Download.deselect(z);
	}/*,

	parse: function(){
		Download.trs.each(function(tr, i){
			Download.fx[i] = new Fx.Styles(tr, {wait: false, duration: 300});

			var chk = tr.getElement('div.check');

			chk.index = i;
			var dp = chk.getProperty('deps');
			if (dp) chk.deps = dp.split(',');

			tr.onclick = function(){
				
				if (Download.isQuick && tr.hasClass('file')){
					Download.quicks.each(function(lee, e){
						if (lee.chosen) Download.quickFx[e].start('0 0');
					});
					Download.isQuick = false;
				}
				
				if (!chk.hasClass('selected')) Download.select(chk);
				else if (tr.hasClass('file')) Download.deselect(chk);
			};
			
			tr.addEvent('mouseenter', function(){
				if (!chk.hasClass('selected')){
					Download.fx[i].start({
						'background-color': '#18181b',
						'color': '#b3b3bb'
					});
				}
			});
			
			tr.addEvent('mouseleave', function(){
				if (!chk.hasClass('selected')){
					Download.fx[i].start({
						'background-color': '#1d1d20',
						'color': '#595965'
					});
				}
			});

		});
	}*/

};

window.addEvent('domready', Download.start);
