define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "dojo/text!AutoLogin/widget/template/AutoLogin.html"

], function (declare, _WidgetBase, _TemplatedMixin, dom,
             dojoDom, dojoProp, dojoGeometry,
             dojoClass, dojoStyle, dojoConstruct,
             dojoArray, lang, dojoText,
             dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";
    return declare("AutoLogin.widget.AutoLoginOffline", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        loginEntity: "",
        usernameAttribute: "",
        passwordAttribute: "",
        usernameTextbox: "",
        passwordTextbox: "",
        buttonLabel: "",

        //DOM elements
        submitButtonNode: null,
        BlurBoxNode: null,

        
        // Internal variables.
        _handles: null,
        _contextObj: null,
        _form: null,

        constructor: function () {
            document.getElementById("content").setAttribute("style", "opacity: 0 !important;");
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            if (this.readOnly || this.get("disabled") || this.readonly) {
                this._readOnly = true;
            }
            this._updateRendering();
            this._setupEvents();
            
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
            setTimeout(function() {
                document.getElementById("content").setAttribute("style", "opacity: 1 !important;");
            }, 100);
            this._getCredentials();
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
            this.submitButtonNode.value = this.buttonLabel;
        },
        
        // Attach events to HTML dom elements
        _setupEvents: function () {
            this.connect(this.submitButtonNode, "click", function (e) {
                this._setCredentials();
            });
            var usernamebox = document.getElementsByClassName(this.usernameTextbox);
            usernamebox[0].childNodes[1].childNodes[0].setAttribute("autocapitalize", "none");
        },

        //get credentials
        _getCredentials: function () {
            logger.debug(this.id + "._getCredentials");
            
            var user = this._contextObj.get(this.usernameAttribute);
            var pass = this._contextObj.get(this.passwordAttribute);
            var page = document.getElementsByClassName("mx-page");
            var usernameTextbox = document.getElementsByClassName(this.usernameTextbox);
            var passwordTextbox = document.getElementsByClassName(this.passwordTextbox);
            var db = openDatabase('Gillz', '1.0', 'CREDS', 2 * 1024 * 1024);
            var inlogobj = this._contextObj;
            var loginfunction = this._loginUsersql;
            var usernameAttribute = this.usernameAttribute;
            var passwordAttribute = this.passwordAttribute;

            
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM LOGS', [], function (tx, results) {
                    user = results.rows.item(0).log;
                    pass = results.rows.item(1).log;
                    usernameTextbox[0].value = user;
                    passwordTextbox[0].value = pass;
                    inlogobj.set(usernameAttribute, user);
                    inlogobj.set(passwordAttribute, pass);
                    if (user.length > 2 && user!="null" && user!="" && user!="UNDEFINED"){
                        page[0].setAttribute("style", "opacity: 0 !important;");
                        setTimeout(function() {
                            page[0].setAttribute("style", "opacity: 1 !important;");
                        }, 3000);
                            loginfunction(user, pass);
                    };
                }, null);
            });                            
        },

        // Set Credentials
        _setCredentials: function () {
            var resultuser = this._contextObj.get(this.usernameAttribute);
            var resultpw = this._contextObj.get(this.passwordAttribute);
            
            var db = openDatabase('Gillz', '1.0', 'CREDS', 2 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql("DROP TABLE LOGS",[], 
                    function(tx,results){
                        //console.error("Table Dropped")
                    },
                    function(tx,error){
                        //console.error("Error: " + error.message)
                    }
                )
                tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)');
                tx.executeSql('INSERT INTO LOGS (id, log) VALUES (1, ?)', [resultuser]);
                tx.executeSql('INSERT INTO LOGS (id, log) VALUES (2, ?)', [resultpw]);
            });        
            this._loginUser();      
        },

        // Login function when sql is found
        _loginUsersql: function (username, password) {
            var _username = username;
            var _password = password;
            var page = document.getElementsByClassName("mx-page");
            mx.login(_username, _password, function() {
                delete window.localStorage.session
            }, function() {
                page[0].setAttribute("style", "opacity: 1 !important;");
                alert("wrong username or password");
            });
        },

        _loginUser: function () {
            var _username = this._contextObj.get(this.usernameAttribute);
            var _password = this._contextObj.get(this.passwordAttribute);
            mx.login(_username, _password, function() {
                delete window.localStorage.session
            }, function() {
                alert("wrong username or password");
            });
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();
            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.backgroundColor,
                    callback: lang.hitch(this, function (guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });
            }
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
require(["AutoLogin/widget/AutoLoginOffline"]);