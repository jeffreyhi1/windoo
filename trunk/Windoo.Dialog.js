/*
Script: Windoo.Dialog.js
	Windoo standard dialog helper functions.
	Contains <Windoo.Alert>, <Windoo.Confirm>.

License:
	MIT-style license.

Copyright:
	copyright (c) 2007 Yevgen Gorshkov
*/

/*
Property: Windoo.Alert
	Create inline modal alert dialog.

Arguments:
	message - message text.
	options - Windoo.Alert options object.

Windoo.Alert options:
	window - custom Windoo window options. see Windoo options.
	buttons - Buttons object.
	panel - custom Panel element options. see Element options.
	message - custom message element options. see Element options.

Buttons:
	ok - custom OK button options. see Element options.
*/

Windoo.Alert = function(message,  options){
	options = $merge(Windoo.Alert.options, options);
	var button = new Element('input', $merge({
		'events': {
			'click': function(){
				win.close();
			}
		}
	}, options.buttons.ok));
	var win = new Windoo($merge({
		'onShow': function(){
			button.focus();
		}
	}, options.window));
	var bound = function(ev){
		ev = new Event(ev);
		if (['enter', 'esc'].contains(ev.key)){
			win.close();
			ev.stop();
			document.removeEvent(ev.type, bound);
		}
	};
	document.addEvent('keydown', bound);
	return win.addPanel(new Element('div', $merge({'class': win.classPrefix('alert-pane')}, options.panel)).adopt(button))
			  .adopt(new Element('div', $merge({'class': win.classPrefix('alert-message')}, options.message)).setHTML(message))
			  .show();
};

Windoo.Alert.options = {
	'window': {
		'modal': true,
		'resizable': false,
		'buttons': {
			'minimize': false,
			'maximize': false
		},
	},
	'buttons': {
		'ok': {
			'properties': {
				'type': 'button',
				'value': 'OK'
			}
		}
	},
	'onConfirm': Class.empty(),
	'panel': null,
	'message': null
};

/*
Property: Windoo.Confirm
	Create inline modal alert dialog.
	Inherits options from <Windoo.Alert>.

Arguments:
	message - message text.
	options - Windoo.Alert options object plus Window.Confirm options.

Windoo.Confirm options:
	onConfirm - optional, function to execute when dialog is confirmed.
	onCancel - optional, function to execute when dialog is rejected.

Buttons:
	ok - custom OK button options. see Element options.
	cancel - custom Cancel button options. see Element options.
*/

Windoo.Confirm = function(message, options){
	var result, cancelFocused = false;
	options = $merge(Windoo.Confirm.options, options);
	var buttons = {
		'ok': new Element('input', $merge({
			'events': {
				'click': function(){
					result = true;
					win.close();
				}
			}
		}, options.buttons.ok)),
		'cancel': new Element('input', $merge({
			'events': {
				'click': function(){
					result = false;
					win.close();
				}
			}
		}, options.buttons.cancel)).addEvents({
			'focus': function(){
				cancelFocused = true;
			},
			'blur': function(){
				cancelFocused = false;
			}
		})
	};
	var win = new Windoo($merge({
		'onShow': function(){
			buttons.ok.focus();
		}
	}, options.window)).addEvent('onClose', function(){
		options[(result) ? 'onConfirm' : 'onCancel'].call(this);
	});
	var bound = function(ev){
		ev = new Event(ev);
		if (['enter', 'esc'].contains(ev.key)){
			if (ev.key == 'enter'){
				result = !cancelFocused;
			} else {
				result = false;
			}
			win.close();
			ev.stop();
			document.removeEvent(ev.type, bound);
		}
	};
	document.addEvent('keydown', bound);
	return win.addPanel(new Element('div', $merge({'class': win.classPrefix('confirm-pane')}, options.panel)).adopt(buttons.ok, buttons.cancel))
			  .adopt(new Element('div', $merge({'class': win.classPrefix('confirm-message')}, options.message)).setHTML(message))
			  .show();
};

Windoo.Confirm.options = $merge(Windoo.Alert.options, {
	'buttons': {
		'cancel': {
			'properties': {
				'type': 'button',
				'value': 'Cancel'
			}
		}
	},
	'onConfirm': Class.empty,
	'onCancel': Class.empty
});
