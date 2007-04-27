
Json.toString=function(obj){
	switch ($type(obj)){
		case 'string':
			return '"'+obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t")+'"';
		case 'array':
			return '['+ obj.map(function(ar){
				return Json.toString(ar);
			}).join(',') +']';
		case 'object':
		case 'class':
			var string = [];
			for (var property in obj) string.push('"'+property+'":'+Json.toString(obj[property]));
			return '{'+string.join(',')+'}';
	}
	return String(obj);
};

Json.format=function(obj, tab){
	tab = $pick(tab, '');
	var tab2 = tab+'\t';
	if (typeof obj == 'object'){
		var string = [];
		for (var property in obj) string.push(tab2+'"'+property+'": '+Json.format(obj[property],tab2));
		return '{\n'+string.join(',\n')+'\n'+tab+'}';
	}
	return Json.toString(obj);
};

String.prototype.encodeTags = function(){
	return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};




/////////////////////////



Windoo.Options = {
	type: 'string:wintype',
	modal: 'bool:modal',
	url: 'string:url',

	position: 'eval:pos',
	width: 'int:width',
	height: 'int:height',
	top: 'int:pos-top',
	left: 'int:pos-left',

	title: 'string:title',
	resizeLimit: {'x': 'eval:xlimit', 'y': 'eval:ylimit'},
	ghost: {'resize': 'bool:ghost-resize', 'drag': 'bool:ghost-drag'},

	buttons: {
		menu: 'eval:button-menu',
		close: 'eval:button-close',
		shade: 'eval:button-shade',
		minimize: 'eval:button-minimize',
		maximize: 'eval:button-maximize'
	},

	container: 'eval:container',
	restrict: 'bool:restrict',

	resizable: 'bool:resizable',
	draggable: 'bool:draggable',
	
	'class': 'string:classname',
	theme: 'string:theme',
	shadow: 'bool:shadow'
};

var AutoOptions = new Class({
	initialize: function(descr){
		this.descr = descr;
		this.options = {};
		this.options = this.parse(this.descr);
	},

	parse: function(descr){
		var options = {};
		for (var z in descr){
			var opt = descr[z];
			switch ($type(opt)){
				case 'string':
					var m = opt.split(':',2);
					var field = $(m[1]) || $(z);
					if (field) {
						var value = this.parseField(field, m[0]);
						if (value != undefined) options[z] = value;
					}
					break;
				case 'object':
					options[z] = this.parse(opt);
					break;
			}
		}
		return options;
	},

	parseField: function(field, type){
		field = $(field);
		if (field.disabled) return;
		var value = field.value;
		try {
			switch (type){
				case "int": return parseInt(value);
				case "float": return parseFloat(value);
				case "eval": return eval(value);
				case "bool": return field.checked;
				case "date": return new Date(value);
				case "function": return eval(value);
				//case "string": return value;
			}
			if (!value) return;
			return value;
		} catch(e){
			return null;
		}
		return;
	}

});

function switcher(block, field, value, duration, nofade){
	block = $(block);
	field = $(field);
	block.setStyle('display', field.value == value ? 'block' : 'none');
	var fx = block.effect('opacity', {duration: $pick(duration, 250), wait: false});
	field.addEvent('change', function(ev){
		if (this.value == value){
			block.setStyles({'display': 'block', 'opacity': 0});
			fx.start(1);
		} else {
			if (!nofade) fx.start(0).chain(function(){
					block.setStyle('display', 'none');
				});
			else
				block.setStyle('display', 'none');
		}
	});
}

function $copyDiff(hash1, hash2){
	var result = {};
	hash2 = hash2 || {};
	for (var z in hash1){
		var val = hash1[z];
		if (typeof val == 'object' && !val.htmlElement){
			var val2 = $copyDiff(val, hash2[z]);
			for (var i in val2){ result[z] = val2; break; }
		} else if(val !== hash2[z]) result[z] = val;
	}
	return result;
}
