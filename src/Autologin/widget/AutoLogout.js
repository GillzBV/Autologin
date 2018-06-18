define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/_base/lang",
    "dojo/text!AutoLogin/widget/template/AutoLogout.html"

], function (declare, _WidgetBase, _TemplatedMixin, lang, widgetTemplate) {
    "use strict";
    return declare("AutoLogin.widget.AutoLogout", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        documentation: "",

        //DOM elements
        logoutButtonNode: null,
        
        // Internal variables.
        _handles: null,

        constructor: function () {
            document.getElementById("content").setAttribute("style", "opacity: 0 !important;");
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._updateRendering();
            this._setupEvents();
        },

        update: function (callback) {
            logger.debug(this.id + ".update");
            this._updateRendering(callback);
            setTimeout(function() {
                document.getElementById("content").setAttribute("style", "opacity: 1 !important;");
            }, 100);
            this._dropTables();
            this._logout();
        },
        
        resize: function (box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
        },
        
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
            this._executeCallback(callback, "_updateRendering");
            
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            this.connect(this.logoutButtonNode, "click", function (e) {
                this._logout();
            });
        },
        
        _dropTables: function () {
            var db = openDatabase('Gillz', '1.0', 'CREDS', 2 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql("DROP TABLE LOGS");
            });
        },
        
        _logout: function () {
            mx.logout();                
        },
        
        // Shorthand for executing a callback, adds logging to your inspector
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});
require(["AutoLogin/widget/AutoLogout"]);