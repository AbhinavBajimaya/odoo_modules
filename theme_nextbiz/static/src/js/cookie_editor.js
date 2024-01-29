odoo.define('theme_nextbiz.cookie_editor_js', function(require) {
    'use strict';
    var options = require('web_editor.snippets.options');
    var ajax = require('web.ajax');
    var core = require('web.core');
    var qweb = core.qweb;
    var _t = core._t;

    ajax.loadXML('/theme_nextbiz/static/src/xml/cookie_bar.xml', qweb);
});