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
        validationtext: "",
        buttonClasses: "",

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
            var cleanclasses = this.buttonClasses.replace(" ", "");
            var splitclasses = cleanclasses.split(',');
            var classeslength = splitclasses.length
            for (var i = 0; i < classeslength; i++) {
                this.submitButtonNode.classList.add(splitclasses[i]);
            }
            var usernamebox = document.getElementsByClassName(this.usernameTextbox);
            usernamebox[0].childNodes[1].childNodes[0].setAttribute("autocapitalize", "none");
            usernamebox[0].childNodes[1].childNodes[0].setAttribute("autocorrect", "off");
        },
        
        // Attach events to HTML dom elements
        _setupEvents: function () {
            this.connect(this.submitButtonNode, "click", function (e) {
                this._setCredentials();
            });
        },

        //get credentials
        _getCredentials: function () {
            logger.debug(this.id + "._getCredentials");

            var loginArgs = {
                addMessage: this._addMessage,
                passwordClass: this.passwordTextbox,
                removeFunction: this._removeMessage,
                page: document.getElementsByClassName("mx-page"),
                validation: this.validationtext
            };
            
            var usernameTextbox = document.getElementsByClassName(this.usernameTextbox);
            var passwordTextbox = document.getElementsByClassName(this.passwordTextbox);
            var db = openDatabase('Gillz', '1.0', 'CREDS', 2 * 1024 * 1024);
            var loginfunction = this._loginUsersql;
            var usernameAttribute = this.usernameAttribute;
            var passwordAttribute = this.passwordAttribute;

            
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM LOGS', [], function (tx, results) {
                    var userResult = results.rows.item(0).log;
                    var passResult = results.rows.item(1).log;
                    usernameTextbox[0].value = userResult;
                    passwordTextbox[0].value = passResult;
                    inlogObj.set(usernameAttribute, userResult);
                    inlogObj.set(passwordAttribute, passResult);
                    if (userResult.length > 2 && userResult!="null" && userResult!="" && userResult!="UNDEFINED"){
                        loginArgs.page[0].setAttribute("style", "opacity: 0 !important;");
                        setTimeout(function() {
                            loginArgs.page[0].setAttribute("style", "opacity: 1 !important;");
                        }, 3000);
                        loginArgs.user = userResult
                        loginArgs.pass = passResult
                        loginfunction(loginArgs);
                    };
                }, null);
            });                            
        },

        // Login function when sql is found
        _loginUsersql: function (loginArgs) {
            mx.login(loginArgs.user, loginArgs.pass, function() {
                delete window.localStorage.session
            }, function() {
                loginArgs.page[0].setAttribute("style", "opacity: 1 !important;");
                loginArgs.addmessage(loginArgs);
            });
        },        

        // Set Credentials
        _setCredentials: function () {
            logger.debug(this.id + "._setCredentials");

            var loginArgs = {
                user: this._contextObj.get(this.usernameAttribute), 
                pass: this._contextObj.get(this.passwordAttribute),
                addMessage: this._addMessage,
                passwordClass: this.passwordTextbox,
                removeFunction: this._removeMessage,
                validation: this.validationtext
            }
            
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
                tx.executeSql('INSERT INTO LOGS (id, log) VALUES (1, ?)', [loginArgs.user]);
                tx.executeSql('INSERT INTO LOGS (id, log) VALUES (2, ?)', [loginArgs.pass]);
            });        
            this._loginUser(loginArgs);      
        },

        _loginUser: function (loginArgs) {
            mx.login(loginArgs.user, loginArgs.pass, function() {
                delete window.localStorage.session
            }, function() {
                loginArgs.addMessage(loginArgs);
            });
        },

        // adds validations message
        _addMessage: function (loginArgs) {
            if (dojo.byId('login-invalid') !== null){
                loginArgs.removeFunction();
            }
            var invalidStr = "<div id='login-invalid' class='alert alert-danger'>" + loginArgs.validation + "</div>"
            var domNode = document.getElementsByClassName(loginArgs.passwordClass)[0];
            dojo.place(invalidStr, domNode, "after");
        },

        _removeMessage : function () {
            dojo.destroy('login-invalid');
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