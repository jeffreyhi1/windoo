/*
Script: Windoo.Ajax.js
	Windoo Ajax helper class.
	Contains <Windoo.Ajax>.

License:
	MIT-style license.

Copyright:
	copyright (c) 2007 Yevgen Gorshkov
*/

/*
Class: Windoo.Ajax
	Extended <Ajax> class to update window content.

Options:
	window - Windoo object to insert the response text of the XHR into, upon completion of the request.
*/

Windoo.Ajax = Ajax.extend({
	onComplete: function(){
		if (this.options.window) this.options.window.setHTML(this.response.text);
		this.parent();
	}
});

