/* PublicaMundi Mapping API version 0.1.0 2015-11-19 */
/* Copyright 2013 William Summers, metaTribal LLC
 * adapted from https://developer.mozilla.org/en-US/docs/JXON
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @author William Summers
 *
 */
// module.exports = xmlToJSON
 
var xmlToJSON = (function () {

    this.version = "1.3";

    var options = { // set up the default options
        mergeCDATA: true, // extract cdata and merge with text
        grokAttr: true, // convert truthy attributes to boolean, etc
        grokText: true, // convert truthy text/attr to boolean, etc
        normalize: true, // collapse multiple spaces to single space
        xmlns: true, // include namespaces as attribute in output
        namespaceKey: '_ns', // tag name for namespace objects
        textKey: '_text', // tag name for text nodes
        valueKey: '_value', // tag name for attribute values
        attrKey: '_attr', // tag for attr groups
        cdataKey: '_cdata', // tag for cdata nodes (ignored if mergeCDATA is true)
        attrsAsObject: true, // if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
        stripAttrPrefix: true, // remove namespace prefixes from attributes
        stripElemPrefix: true, // for elements of same name in diff namespaces, you can enable namespaces and access the nskey property
        childrenAsArray: true // force children into arrays
    };

    var prefixMatch = new RegExp(/(?!xmlns)^.*:/);
    var trimMatch = new RegExp(/^\s+|\s+$/g);

    this.grokType = function (sValue) {
        if (/^\s*$/.test(sValue)) {
            return null;
        }
        if (/^(?:true|false)$/i.test(sValue)) {
            return sValue.toLowerCase() === "true";
        }
        if (isFinite(sValue)) {
            return parseFloat(sValue);
        }
        return sValue;
    };

    this.parseString = function (xmlString, opt) {
        return this.parseXML(this.stringToXML(xmlString), opt);
    }

    this.parseXML = function (oXMLParent, opt) {

        // initialize options
        for (var key in opt) {
            options[key] = opt[key];
        }

        var vResult = {},
            nLength = 0,
            sCollectedTxt = "";

        // parse namespace information
        if (options.xmlns && oXMLParent.namespaceURI) {
            vResult[options.namespaceKey] = oXMLParent.namespaceURI;
        }

        // parse attributes
        // using attributes property instead of hasAttributes method to support older browsers
        if (oXMLParent.attributes && oXMLParent.attributes.length > 0) {
            var vAttribs = {};

            for (nLength; nLength < oXMLParent.attributes.length; nLength++) {
                var oAttrib = oXMLParent.attributes.item(nLength);
                vContent = {};
                var attribName = '';

                if (options.stripAttrPrefix) {
                    attribName = oAttrib.name.replace(prefixMatch, '');

                } else {
                    attribName = oAttrib.name;
                }

                if (options.grokAttr) {
                    vContent[options.valueKey] = this.grokType(oAttrib.value.replace(trimMatch, ''));
                } else {
                    vContent[options.valueKey] = oAttrib.value.replace(trimMatch, '');
                }

                if (options.xmlns && oAttrib.namespaceURI) {
                    vContent[options.namespaceKey] = oAttrib.namespaceURI;
                }

                if (options.attrsAsObject) { // attributes with same local name must enable prefixes
                    vAttribs[attribName] = vContent;
                } else {
                    vResult[options.attrKey + attribName] = vContent;
                }
            }

            if (options.attrsAsObject) {
                vResult[options.attrKey] = vAttribs;
            } else {}
        }

        // iterate over the children
        if (oXMLParent.hasChildNodes()) {
            for (var oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
                oNode = oXMLParent.childNodes.item(nItem);

                if (oNode.nodeType === 4) {
                    if (options.mergeCDATA) {
                        sCollectedTxt += oNode.nodeValue;
                    } else {
                        if (vResult.hasOwnProperty(options.cdataKey)) {
                            if (vResult[options.cdataKey].constructor !== Array) {
                                vResult[options.cdataKey] = [vResult[options.cdataKey]];
                            }
                            vResult[options.cdataKey].push(oNode.nodeValue);

                        } else {
                            if (options.childrenAsArray) {
                                vResult[options.cdataKey] = [];
                                vResult[options.cdataKey].push(oNode.nodeValue);
                            } else {
                                vResult[options.cdataKey] = oNode.nodeValue;
                            }
                        }
                    }
                } /* nodeType is "CDATASection" (4) */
                else if (oNode.nodeType === 3) {
                    sCollectedTxt += oNode.nodeValue;
                } /* nodeType is "Text" (3) */
                else if (oNode.nodeType === 1) { /* nodeType is "Element" (1) */

                    if (nLength === 0) {
                        vResult = {};
                    }

                    // using nodeName to support browser (IE) implementation with no 'localName' property
                    if (options.stripElemPrefix) {
                        sProp = oNode.nodeName.replace(prefixMatch, '');
                    } else {
                        sProp = oNode.nodeName;
                    }

                    vContent = xmlToJSON.parseXML(oNode);

                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) {
                            vResult[sProp] = [vResult[sProp]];
                        }
                        vResult[sProp].push(vContent);

                    } else {
                        if (options.childrenAsArray) {
                            vResult[sProp] = [];
                            vResult[sProp].push(vContent);
                        } else {
                            vResult[sProp] = vContent;
                        }
                        nLength++;
                    }
                }
            }
        } else if (!sCollectedTxt) { // no children and no text, return null
            if (options.childrenAsArray) {
                vResult[options.textKey] = [];
                vResult[options.textKey].push(null);
            } else {
                vResult[options.textKey] = null;
            }
        }

        if (sCollectedTxt) {
            if (options.grokText) {
                var value = this.grokType(sCollectedTxt.replace(trimMatch, ''));
                if (value !== null && value !== undefined) {
                    vResult[options.textKey] = value;
                }
            } else if (options.normalize) {
                vResult[options.textKey] = sCollectedTxt.replace(trimMatch, '').replace(/\s+/g, " ");
            } else {
                vResult[options.textKey] = sCollectedTxt.replace(trimMatch, '');
            }
        }

        return vResult;
    }


    // Convert xmlDocument to a string
    // Returns null on failure
    this.xmlToString = function (xmlDoc) {
        try {
            var xmlString = xmlDoc.xml ? xmlDoc.xml : (new XMLSerializer()).serializeToString(xmlDoc);
            return xmlString;
        } catch (err) {
            return null;
        }
    }

    // Convert a string to XML Node Structure
    // Returns null on failure
    this.stringToXML = function (xmlString) {
        try {
            var xmlDoc = null;

            if (window.DOMParser) {

                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(xmlString, "text/xml");

                return xmlDoc;
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(xmlString);

                return xmlDoc;
            }
        } catch (e) {
            return null;
        }
    }

    return this;
})();

if (typeof module != "undefined" && module !== null && module.exports) module.exports = xmlToJSON;
else if (typeof define === "function" && define.amd) define(function() {return xmlToJSON});
;(function() {
    var factory = function ($, PublicaMundi) {
        "use strict";

        // Relative path to this script
        var _relativePath = null;

        // Default library to use
        var _defaultLib = null;

        // Scripts to load
        var _scripts = [];
        var _loadingScript = null;

        // Available layer types
        PublicaMundi.LayerType = {
            WMS: 'WMS',
            WFS: 'WFS',
            TILE: 'Tile',
            GeoJSON: 'GeoJSON',
            KML: 'KML',
            GML: 'GML',
            GPX: 'GPX',
            CSV: 'CSV',
            WCS: 'WCS',
            WCPS: 'WCPS'
        };

        // Version
        PublicaMundi.version = '0.0.1';

        // Define a new namespace using dot (.) notation e.g. PublicaMundi.Layer.WFS
        PublicaMundi.define = function (namespace) {
            if (!namespace) return;
            var parts = namespace.split('.');

            for (var current = window, index = 0; index < parts.length; index++) {
                if (!parts[index]) {
                    continue;
                }
                if (typeof current[parts[index]] === 'undefined') {
                    current[parts[index]] = {
                        __namespace: parts.slice(0, index + 1).join('.')
                    };
                }
                current = current[parts[index]];
            }
        };

        var _extend = function (target, source) {
            if (source) {
                for (var property in source) {
                    if ((source.hasOwnProperty(property)) && (source[property] !== undefined)) {
                        target[property] = source[property];
                    }
                }
            }

            return target;
        };

        // Class inheritance based on OpenLayers 2.x
        // Declare base Class. Javascript is not an object oriented language. We are simulating classes and
        // inheritance using this class.
        // In order to create a new class we use the following syntax:
        //
        // var newClass = ChemSafe.Class(prototype);
        //
        // The call above will return a new Function object that will be used as our new Class constructor.
        // To create a new class with multiple inheritance, use the following syntax:
        //
        // var newClass = ChemSafe.Class(Class1, Class2, ... , ClassN, prototype);
        //
        // Note that instanceof reflection will only reveil Class1 as superclass. Class2 to ClassN are mixins.
        // All the properties and methods added to the prototype parameter will become members of the new Class
        // prototype.
        PublicaMundi.Class = function () {
            var classes = arguments;

            // This is the new class we are going to create. The new class is actuall a Function object.
            // Every Class created with this method is expected to have an initialize() method. Also the derived
            // classes are responsible for calling their parent class initialize method. The initialize() method
            // is used for setting 'private' members using this.property = value assignments.
            var Class = function () {
                if (typeof this.initialize === 'function') {
                    this.initialize.apply(this, arguments);
                }
            };

            // New class prototype
            var prototype = {};
            // Last parent class and helper variable for storing parent class initilize() method reference.
            var parent, initialize;

            var _initialize = function () { };

            // Start adding functionality to our class
            for (var i = 0, len = arguments.length; i < len; ++i) {
                // Check if the given argument is of type function; Hence it is a base "Class"
                if (typeof arguments[i] === "function") {
                    // Make the class passed as the first argument the superclass. By doing so,
                    // we have to create a new instance of this class and set it as the prototype of
                    // our new class.
                    if (i === 0 && len > 1) {
                        // Create a reference to the parent class initialize method. As mentioned earlier this method
                        // is used for setting private members. We dont want to create this members right now as they
                        // will be created when we create actual instances of our new class.
                        initialize = arguments[i].prototype.initialize;
                        // Replace the initialize method with an empty function,
                        // because we do not want to create a real instance here
                        arguments[i].prototype.initialize = _initialize();
                        // The line below makes sure that the new class has a
                        // superclass
                        prototype = new arguments[i]();
                        prototype.constructor = Class;
                        // Restore the original initialize method
                        if (initialize === undefined) {
                            delete arguments[i].prototype.initialize;
                        } else {
                            arguments[i].prototype.initialize = initialize;
                        }
                    }
                    // Get the prototype of the superclass
                    parent = arguments[i].prototype;
                } else {
                    // In this case we're extending with the prototype
                    parent = arguments[i];
                }
                // By extending the class prototype with the parent prototype all the methods and properties of the
                // two classess are merged.
                _extend(prototype, parent);
            }
            // Set new class prototype. The  'prototype' object has gathered the properties and functions
            // of all the parent classes.
            Class.prototype = prototype;
            Class.prototype.constructor = Class;

            return Class;
        };


        // Methods and properties for resolving mapping frameworks
        var _resolvers = {};

        PublicaMundi.registerFrameworkResolver = function (name, resolver) {
            if (_resolvers.hasOwnProperty(name)) {
                console.log('Resolver for framework ' + name + ' already registered.');
                return false;
            }

            _resolvers[name] = resolver;

            return true;
        };

        PublicaMundi.resolveFramework = function () {
            for (var name in _resolvers) {
                if (_resolvers[name]()) {
                    return name;
                }
            }
            return null;
        };

        // Helper functions
        PublicaMundi.isDefined = function (arg) {
            return (typeof arg !== 'undefined');
        };

        PublicaMundi.isFunction = function (arg) {
            return (typeof arg === 'function');
        };

        PublicaMundi.isObject = function (arg) {
            return (typeof arg === 'object');
        };

        PublicaMundi.isEmpty = function (arg) {
            if (arg === null) return true;

            // Assume if it has a length property with a non-zero value
            // that that property is correct.
            if (arg.length > 0)    return false;
            if (arg.length === 0)  return true;

            // Otherwise, does it have any properties of its own?
            // Note that this doesn't handle
            // toString and valueOf enumeration bugs in IE < 9
            for (var key in arg) {
                if (hasOwnProperty.call(arg, key)) return false;
            }

            return true;
           };

        PublicaMundi.isClass = function (arg) {
            var parts = arg.split('.');
            for (var current = window, index = 0; index < parts.length; index++) {
                if ((!parts[index]) || (typeof current[parts[index]] === 'undefined')) {
                    return false;
                }
                if ((index === parts.length - 1) && (typeof current[parts[index]] !== 'function')) {
                    return false;
                }
                current = current[parts[index]];
            }

            return true;
        };

        PublicaMundi.isArray = function (arg) {
            if (!Array.isArray) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            }
            return Array.isArray(arg);
        };

        PublicaMundi.getQueryStringParameters = function (url) {
            var parameters = {};
            url.replace(
                new RegExp("([^?=&]+)(=([^&#]*))?", "g"),
                function ($0, $1, $2, $3) { parameters[$1] = $3; }
            );

            return parameters;
        };

        // Locator service used for implementing Dependency Injection. Types (including their namespace)
        // are associated to a function (constructor/class)
        PublicaMundi.locator = {
            _dependencies: [],
            _factories: [],
            register: function (type, factory) {
                var index = this._dependencies.indexOf(type);
                if (index < 0) {
                    this._dependencies.push(type);
                    this._factories.push(factory);
                } else {
                    this._factories[index] = factory;
                }
                return factory;
            },
            unregister: function (type) {
                var index = this._dependencies.indexOf(type);
                if (index >= 0) {
                    this._dependencies.splice(index, 1);
                    this._factories.splice(index, 1);
                }
            },
            resolve: function (type) {
                var index = this._dependencies.indexOf(type);
                if (index < 0) {
                    return null;
                }
                return this._factories[index];
            },
            create: function (type, options) {
                var Factory = this.resolve(type);
                if (Factory) {
                    return new Factory(options);
                }
                return null;
            }
        };

        /*

        // Layer type registration

        var registration = {
            // Layer type
            layer: PublicaMundi.LayerType.WMS,
            // Framework
            framework: OpenLayers,
            // Class type
            type: 'PublicaMundi.OpenLayers.Layer.WMS',
            // Constructor
            factory: function () { }
        };
        */

        PublicaMundi.registry = {
            _LayerTypeRegistry: [],
            registerLayerType: function (options) {
                var registration = null;

                for (var index = 0; index < this._LayerTypeRegistry.length; index++) {
                    if ((this._LayerTypeRegistry[index].layer === options.layer) &&
                       (this._LayerTypeRegistry[index].framework === options.framework)) {
                        registration = this._LayerTypeRegistry[index];
                        break;
                    }
                }
                if (registration) {
                    registration.type = options.type;
                } else {
                    registration = {
                        layer: options.layer,
                        framework: options.framework,
                        type: options.type
                    };
                    this._LayerTypeRegistry.push(registration);
                }
                PublicaMundi.locator.register(options.type, options.factory);
            },
            resolveLayerType: function (layer) {
                var registration = null;
                // TODO : Resolve framework only once during loading?
                var framework = PublicaMundi.resolveFramework();
                for (var index = 0; index < this._LayerTypeRegistry.length; index++) {
                    if ((this._LayerTypeRegistry[index].layer === layer) &&
                       (this._LayerTypeRegistry[index].framework === framework)) {
                        registration = this._LayerTypeRegistry[index];
                        break;
                    }
                }

                if (registration) {
                    return registration.type;
                }
                return null;
            },
            createLayer: function (options) {
                // TODO : Handle dynamic layer detection
                var type = this.resolveLayerType(options.type);

                if (type) {
                    return PublicaMundi.locator.create(type, options);
                }
                return null;
            },
            getFactories: function () {
                return this._LayerTypeRegistry.map(function (m) {
                    return PublicaMundi.locator.resolve(m.type);
                });
            }
        };

        // Allow to restore existing variables
        PublicaMundi._PM = window.PM;

        PublicaMundi.noConflict = function () {
            if (window.PM === PublicaMundi) {
                if (typeof this._PM !== 'undefined') {
                    window.PM = this._PM;
                } else {
                    delete window.PM;
                }
            }
            return this;
        };

        // This solution will not work if a module loader is used or scripts are loaded with
        // the defer/async attribute ...
        _relativePath = jQuery('script').last().attr('src');
        _relativePath = _relativePath.substring(0, _relativePath.lastIndexOf('/') + 1);

        // Get default library
        _defaultLib = jQuery('script').last().data('library');
        if (!_defaultLib) {
            _defaultLib = 'ol';
        }

        // Function for handling asynchronous resource loading
        PublicaMundi.ready = function (method) {
            if (!PublicaMundi.isFunction(method)) {
                console.log('Argument for ready() is not a function.');
                return;
            }

            // Load default scripts
            if (!PublicaMundi.resolveFramework()) {
                $('<link/>', {
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: _relativePath + 'lib/' + _defaultLib + '/' + _defaultLib + '.css'
                }).appendTo('head');

                _scripts.push(_relativePath + 'lib/' + _defaultLib + '/' + _defaultLib + '.js');
                _scripts.push(_relativePath + 'publicamundi.' + _defaultLib + '.js');
            }

            if (_scripts.length === 0) {
                method();
            } else {
                var loader = function () {
                    if (_loadingScript) {
                        _loadingScript = null;
                    }
                    if (_scripts.length > 0) {
                        _loadingScript = _scripts[0];
                        _scripts.shift();
                        $.ajax({
                            url: _loadingScript,
                            dataType: "script",
                            success: loader,
                            cache: true
                        });
                    } else {
                        method();
                    }
                };
                loader();
            }
        };

        return PublicaMundi;
    }

    if((typeof define != 'undefined') && (define.amd)) {
        define(['jquery', 'shared'], factory);
    } else {
        if(typeof PublicaMundi === 'undefined') {
            PublicaMundi = {
                __namespace: 'PublicaMundi'
            };
        }
        factory($, PublicaMundi);
    }
})();
;(function (window, PublicaMundi) {
    "use strict";

    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.Map = PublicaMundi.Class({
        initialize: function (options) {
            this._map = null;
            this._layers = [];
            this._control = null;
            this._viewbox = '0,0,0,0';
            this._popup = null;
            this._highlight = null;
            this._featureOverlay = null;

            options = options || {};
            options.target = (PublicaMundi.isDefined(options.target) ? options.target : null);
            options.projection = (PublicaMundi.isDefined(options.projection) ? options.projection : 'EPSG:3857');
            options.center = (PublicaMundi.isDefined(options.center)) ? options.center : [0, 0];
            options.zoom = (PublicaMundi.isDefined(options.zoom)) ? options.zoom : 2;
        },
        setExtent: function(extent) {
            return this;
        },
        _setViewBox: function() {
            return this;
        },
        _getViewBox: function() { 
            return this._viewbox;
        },
        setLayerControl: function(c) {
            return this;
        },
        getLayerControl: function() {
            return this._control;
        },
        getMap: function () {
            return this._map;
        },
        getOverlay: function(){
            return this._popup;
        },
        getFeatureOverlay: function(){
            return this._featureOverlay;
        },
        setCenter: function (x, y) {
            return this;
        },
        getCenter: function () {
            return null;
        },
        setZoom: function (z) {
            return this;
        },
        getZoom: function () {
            return null;
        },
        getProjection: function () {
            return null;
        },
        getTarget: function () {
            return null;
        },
        getLayers: function() {
            return this._layers;
        },
        _listen: function() { 
            return null;
        },

        createLayer: function (options) {
            var layer = null;

            switch (typeof options) {
                case 'string':
                    // Try to guess the data type
                    var suffixes = ['.gson', '.geojson'];
                    if (suffixes.some(function (item) { return options.indexOf(item, options.length - item.length); })) {
                        this.createLayer({
                            type: PublicaMundi.LayerType.GeoJSON,
                            url: options,
                            projection : this.getProjection()
                        });
                    }
                    break;
                case 'object':
                    var factories = PublicaMundi.registry.getFactories();
                    for (var r = 0; r < factories.length; r++) {
                        if (options instanceof factories[r]) {
                            layer = options;
                            break;
                        }
                    }

                    if (!layer) {
                        if (!PublicaMundi.isDefined(options.projection)) {
                            options.projection = this.getProjection();
                        }
                        layer = PublicaMundi.registry.createLayer(options);
                        layer.setMap(this);
                    }

                    if (layer) {
                        this.addLayer(layer);
                    } else {
                        console.log('Layer of type ' + options.type + ' is not supported.');
                    }
                    break;
            }

            if (layer) {
                this._layers.push(layer);
            }

            return layer;
        },
        addLayer: function (layer) {
        },
        removeLayer: function (layer) {
        }
    });

    // Register new types to service locator
    PublicaMundi.locator.register('PublicaMundi.Map', PublicaMundi.Map);

    // Create factory method
    PublicaMundi.map = function (options) {
        return PublicaMundi.locator.create('PublicaMundi.Map', options);
    };

    // Initialize a map by a single url (see examples)
    PublicaMundi.configure = function (target, url, onLoad) {
        var _map = (typeof target === 'string' ? PublicaMundi.map({ target: target }) : PublicaMundi.map(target));

        jQuery.getJSON(url, function (data) {
            if (data.center) {
                _map.setCenter(data.center);
            }
            if (data.zoom) {
                _map.setZoom(data.zoom);
            }
            if (PublicaMundi.isArray(data.layers)) {
                for (var l = 0; l < data.layers.length; l++) {
                    _map.addLayer(data.layers[l]);
                }
            }
            if (PublicaMundi.isFunction(onLoad)) {
                onLoad.call(this, data);
            }
        });

        return _map;
    };

})(window, window.PublicaMundi);
;(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Helpers = PublicaMundi.Class({
        initialize: function (options) {
        },
        
      });

   // PublicaMundi.helpers = function () {
  //      return PublicaMundi.locator.create('PublicaMundi.Helpers');
  //  };

    PublicaMundi.locator.register('PublicaMundi.Helpers', PublicaMundi.Helpers);
})(window, PublicaMundi);
;(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Parser = PublicaMundi.Class({
        initialize: function (options) {
        
        },
        parseWMS: function(responseXML) {
            var obj = {};
            var response;
            // First check if response is valid XML
            try{
                //response = xmlToJson(responseXML, {stripAttrPrefix:true});
                response = xmlToJSON.parseXML(responseXML, {childrenAsArray: false});
            }
            catch(err){
                console.log(err);
                obj.success = false;
                obj.error_msg = "Server response is not a valid XML document. Cannot display";
                return obj;
            }

            //var version = response["version"];
            if (response["ServiceExceptionReport"]){
                obj.success = false;
                obj.error_msg = "Service Exception Report. Please try again.";
                return obj;
                //return false;
            }
            var base = null;
            if (response["WMS_Capabilities"]){
                base = response["WMS_Capabilities"];
            }
            else if (response["WMT_MS_Capabilities"]){
                base = response["WMT_MS_Capabilities"];
                if (base instanceof Array){
                    for (var idx in base){
                        var node = base[idx];
                        if (node["Capability"]){
                            base = node;
                        }
                    }
                    }
            }
            if (!base["_attr"]){
                obj.success = false;
                obj.error_msg = "WMS Capabilities Load Exception. Please try again.";
                return obj;
            }

            obj.version = base["_attr"]["version"]["_value"];
            
            var candidates = [];

            //No layers so return
            if (! base["Capability"]["Layer"]){
                obj.success = false;
                obj.error_msg = "No WMS Layers found in provided endpoint.";
                return obj;
            }
            if (base["Capability"]["Layer"]["Layer"]){
                candidates = base["Capability"]["Layer"]["Layer"];
                }
            else if (base["Capability"]["Layer"]) {
                candidates = base["Capability"]["Layer"];
            }
            if (!(candidates instanceof Array)){
                candidates = [candidates];
            }
             
            for (var idx in candidates){
                var candidate = candidates[idx];
                
                candidate["Name"] = candidate["Name"]["_text"];
                candidate["Title"] = candidate["Title"] ? candidate["Title"]["_text"] : candidate["Name"]["_text"];
                candidate["Abstract"] = candidate["Abstract"] ? candidate["Abstract"]["_text"] : '';
                candidate["CRS"] = candidate["CRS"] ? candidate["CRS"]["_text"] : '';

                var bbox = null;
                var bboxfloat = null;
                if (candidate["EX_GeographicBoundingBox"]){
                    bbox = candidate["EX_GeographicBoundingBox"];
                    var eLng = bbox['eastBoundLongitude']['_text'];
                    var wLng = bbox['westBoundLongitude']['_text'];
                    var nLat = bbox['northBoundLatitude']['_text'];
                    var sLat = bbox['southBoundLatitude']['_text'];

                    bboxfloat = [wLng, sLat, eLng, nLat];
                    candidate["EX_GeographicBoundingBox"] = bboxfloat;
                }
                else if (candidate["LatLonBoundingBox"]) {
                    bbox = candidate["LatLonBoundingBox"]['_attr'];
                    var eLng = bbox['minx']['_value'];
                    var wLng = bbox['maxx']['_value'];
                    var nLat = bbox['maxy']['_value'];
                    var sLat = bbox['miny']['_value'];

                    bboxfloat = [wLng, sLat, eLng, nLat];
                    candidate["EX_GeographicBoundingBox"] = bboxfloat;
                }
            }    
       
            obj.Layer = candidates;
            obj.success = true; 
            return obj;
        },
        
        parseWFS: function(responseXML) {
            var obj = {};
            var response;
            // First check if response is valid XML
            try{
                response = xmlToJSON.parseXML(responseXML, {childrenAsArray: false});
            }
            catch(err){
                console.log(err);
                obj.success = false;
                obj.error_msg = "Server response is not a valid XML document. Cannot display";
                return obj;

            }

            var base = null;
             if (response["WFS_Capabilities"]){
                base = response["WFS_Capabilities"];
            }
            else{
                console.log('unexpected version'); 
                console.log(version); 
                obj.success = false;
                obj.error_msg = "WFS Capabilities error. Could not load layers.";
                return obj;
            }
            var version = null;
            if (base["_attr"]){
                version = base["_attr"]["version"]["_value"];
            }
            obj = base;
            obj.version = version;
   
            var candidates = [];
            if (base["FeatureTypeList"]){
                candidates = base["FeatureTypeList"]["FeatureType"];
            }
            else if (base["wfs:FeatureTypeList"]) {
                candidates = base["wfs:FeatureTypeList"]["wfs:FeatureType"];
            }
            else{
                obj.success = false;
                obj.error_msg = "No WFS Features provided in selected endpoint.";
                return obj;
            }
            for (var idx in candidates){
                var candidate = candidates[idx];
                
                candidate["Name"] = candidate["Name"]["_text"];
                candidate["Title"] = candidate["Title"]["_text"];
                candidate["Abstract"] = candidate["Abstract"]["_text"];
                
                var keywords = [];
                for (var kidx in candidate["Keywords"]["Keyword"]){
                    var current = candidate["Keywords"]["Keyword"][kidx];
                    keywords.push(current["_text"]);
                }
                candidate["Keywords"] = keywords;
                
                var bbox = candidate["WGS84BoundingBox"];
                var bboxfloat = null;
                if (bbox){
                    var lc = bbox['LowerCorner']["_text"].split(' ');
                    var uc = bbox['UpperCorner']["_text"].split(' ');        
                    bboxfloat = [ parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]) ];
                    
                    candidate["WGS84BoundingBox"] = bboxfloat;
                }

                var crs = null;
                if (candidate["DefaultCRS"]){
                    var crs_raw = candidate["DefaultCRS"]["_text"];
                    var crs_arr = crs_raw.split(":");
                    crs = crs_arr[crs_arr.length-3]+":"+crs_arr[crs_arr.length-1];
                    candidate["DefaultCRS"] = crs; 
                }

            } 
            obj.Layer = candidates;

            var format_vals = null;
            if (base["OperationsMetadata"]){
                format_vals = base["OperationsMetadata"]["Operation"];
            }
            obj.Format = format_vals;
                        
            obj.success = true; 
            return obj;
        },

    });

    PublicaMundi.locator.register('PublicaMundi.Parser', PublicaMundi.Parser);
    // Create factory method
    PublicaMundi.parser = function (options) {
        return PublicaMundi.locator.create('PublicaMundi.Parser', options);
    };

})(window, PublicaMundi);
;(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Layer = PublicaMundi.Class({
        initialize: function (options) {

            this._map = null;
            this._type = null;
            this._layer = null;
            this._style = {
                    normal:{
                        color: '#3399CC',
                        radius: 6,
                        weight: 1.25,
                        opacity: 1,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.4
                    },
                    highlight:{}
                  
            };
            this._extent = options.bbox || null;
            this._options = options || {};
        },
        setMap: function(map) {
            this._map = map;
        },
        getMap: function() {
            return this._map;
        },
        getType: function() {
            return this._type;
        },
        getLayer: function () {
            return this._layer;
        },
        getStyle: function () {
            return this._style;
        },
        fitToMap: function() {
            return this._extent;
        },
        onLayerLoad: function() {
            return this._layer;
        },
        getOptions: function () {
            return this._options;
        },
        addToControl: function() { 
            return null;
        },
        update: function() {
            return null;
        },
        _transformStyle: function() {
            return null;
        },

    });

    PublicaMundi.locator.register('PublicaMundi.Layer', PublicaMundi.Layer);
})(window, PublicaMundi);

//# sourceMappingURL=publicamundi-src.js.map