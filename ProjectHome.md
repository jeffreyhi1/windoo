# About #
**Windoo** is a javascript class based on [Mootools](http://mootools.net) framework which allows you to create draggable and resizable inline windows on your HTML page.

Windoo also includes the following standalone extensions:
  * **Drag.Multi** is Drag.Base extension which gives the ability to change multiple styles for multiple elements at the same time according to the mouse movement
  * **Drag.Resize** is Mootools extension which applies drag handles to an element to make it resizable in 8 directions

# Features #
  * resizable in 8 directions (fully customizable)
  * works on Firefox, Opera, Safari, and IE 6, 7
  * support custom and container element limits for resize
  * fully customizable Windoo themes
  * preserve aspect ratio option
  * multiple window managers
  * support iframe overlay for IE (fixes 

&lt;select&gt;

 bug) and FF (speed-up rendering)
  * generates valid XHTML strict code
  * modular source code with custom download builder

# Examples #
  * [Drag.Multi](http://windoo.110mb.com/examples/example.php): multiple elements styles change on mouse move
  * [Drag.Resize](http://windoo.110mb.com/examples/resize.php): customizable 8-way resizable elements
  * [Windoo](http://windoo.110mb.com/template/windoo.html): template Windoo page & demos
  * [Windoo Aqua](http://windoo.110mb.com/template/aqua.html) (new): MacOS X Aqua theme demonstration for Windoo
  * [Windoo builder](http://windoo.110mb.com/examples/windoo-builder.php): configure your window
  * [Windoo.Ajax](http://windoo.110mb.com/examples/windoo-ajax.php): dynamic window content loading

# Download #
  * **[Windoo download builder](http://windoo.110mb.com/download/)**:

> Download your own Windoo build (without Windoo themes).

  * **[Windoo themes, projects sources](http://code.google.com/p/windoo/downloads/list)**:

> Download **Windoo themes** package, full sources archive, and documentation from 'Featured Downloads' section.


# Discuss #
There is only an [open thread](http://forum.mootools.net/viewtopic.php?id=2644) on Mootools forum.

# Changes #
  * `[23.06.2007]` svn [revision 86](https://code.google.com/p/windoo/source/detail?r=86):
    * updated to mootools v1.11
    * added MacOS X aqua-like theme for Windoo
    * better support for complex aqua-like shadows
    * fixed minimized and rolled window layout on IE6
    * fixed weird scrollbars in Safari and IE6
    * fixed back transparent window shadow
    * Drag.Resize::el renamed to element (compatible)
  * `[01.06.2007]` svn [revision 73](https://code.google.com/p/windoo/source/detail?r=73):
    * **modular source structure**
    * download build page
    * new classes and extensions:
      * Fx.Overlay (fixed unnecessary horizontal scollbar in IE6)
      * **Windoo.Panel** (fixed window toolbars)
      * **Windoo.Dialog** (modal alert and confirm dialogs)
    * new function **Windoo::wrap** (create window around the element preserving its size and position)
    * optional minimize button behaviour to **roll window** into a title
    * new template usage page
    * speed-up rendering during resize in FF2
    * basic support for fixed/pinned window position
    * various bugfixes, etc.

  * `[08.05.2007]` ([r45](https://code.google.com/p/windoo/source/detail?r=45)) updated to mootools.v1.1 release and various bugfixes.
  * `[01.05.2007]` **Breaking changes** in Drag.Multi::add arguments to simply 'binding' modifiers, see docs and demos for details; added cross-browser support for window shadow with rounded corners (png images with alpha channel).
  * `[27.04.2007]` new **Windoo.Ajax class and demo**, fixed IE window layout, improved resize speed in IE6, bug fixes.
  * `[24.04.2007]` Windoo builder page, disabled button state.