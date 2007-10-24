/*
Script: Windoo.Ajax.js
	Ajax class extension for updating Windoo instance content.
	Contains <Windoo.Ajax>.
*/

/*
Class: Windoo.Ajax
	Extended <Ajax> class to update window content.

Options:
	window - Windoo object to insert the response text of the XHR into, upon completion of the request.
*/

Windoo.Ajax = new Class({
	Extends: Ajax,

	onComplete: function(){
		if (this.options.window) this.options.window.set('html',this.response.text);
		this.parent();
	}
});

