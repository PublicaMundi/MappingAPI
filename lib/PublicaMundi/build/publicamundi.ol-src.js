/* PublicaMundi Mapping API version 0.1.0 2014-12-03 */
(function (window, PublicaMundi) {
	"use strict";

	if (typeof PublicaMundi === 'undefined') {
		return;
	}
	
	PublicaMundi.define('PublicaMundi.OpenLayers');

	PublicaMundi.OpenLayers.Framework = 'ol';

	PublicaMundi.registerFrameworkResolver(PublicaMundi.OpenLayers.Framework, function () {
	    if ((PublicaMundi.isObject(ol)) && (PublicaMundi.isFunction(ol.Map))) {
	        return true;
	    }
	    return false;
	});


})(window, PublicaMundi);
;/**
 * OpenLayers 3 Layer Switcher Control.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.LayerSwitcher = function(opt_options) {

    var options = opt_options || {};

    this.mapListeners = [];

    this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
    this.shownClassName = this.hiddenClassName + ' shown';

    var element = document.createElement('div');
    element.className = this.hiddenClassName;

    var button = document.createElement('button');
    element.appendChild(button);

    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    element.appendChild(this.panel);

    var this_ = this;

    element.onmouseover = function(e) {
        this_.showPanel();
    };

    button.onclick = function(e) {
        this_.showPanel();
    };

    element.onmouseout = function(e) {
        e = e || window.event;
        if (!element.contains(e.toElement)) {
            this_.hidePanel();
        }
    };

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};

ol.inherits(ol.control.LayerSwitcher, ol.control.Control);

/**
 * Show the layer panel
 */
ol.control.LayerSwitcher.prototype.showPanel = function() {
    if (this.element.className != this.shownClassName) {
        this.element.className = this.shownClassName;
        this.render();
    }
};

/**
 * Hide the layer panel
 */
ol.control.LayerSwitcher.prototype.hidePanel = function() {
    if (this.element.className != this.hiddenClassName) {
        this.element.className = this.hiddenClassName;
    }
};

/**
 * Cause the panel to be re-draw to represent the current layer state.
 */
ol.control.LayerSwitcher.prototype.render = function() {

    while(this.panel.firstChild) {
        this.panel.removeChild(this.panel.firstChild);
    }

    var ul = document.createElement('ul');
    this.panel.appendChild(ul);
    this.renderLayers_(this.getMap(), ul);
};

/**
 * Set the map instance the control is associated with.
 * @param {ol.Map} map The map instance.
 */
ol.control.LayerSwitcher.prototype.setMap = function(map) {
    // Clean up listeners associated with the previous map
    for (var i = 0, key; i < this.mapListeners.length; i++) {
        this.getMap().unByKey(this.mapListeners[i]);
    }
    this.mapListeners.length = 0;
    // Wire up listeners etc. and store reference to new map
    ol.control.Control.prototype.setMap.call(this, map);
    var this_ = this;
    this.mapListeners.push(map.on('pointerdown', function() {
        this_.hidePanel();
    }));
    this.render();
};

/**
 * Toggle the visible state of a layer.
 * Takes care of hiding other layers in the same exclusive group if the layer
 * is toggle to visible.
 * @private
 * @param {ol.layer.Base} The layer whos visibility will be toggled.
 */
ol.control.LayerSwitcher.prototype.toggleLayer_ = function(lyr) {
    var map = this.getMap();
    lyr.setVisible(!lyr.getVisible());
    if (lyr.get('type') === 'base') {
        // Hide all other base layers regardless of grouping
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l.get('type') === 'base' && l != lyr) {
                l.setVisible(false);
            }
        });
    }
};

/**
 * Render all layers that are children of a group.
 * @private
 * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
 * @param {Number} idx Position in parent group list.
 */
ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr, idx) {

    var this_ = this;

    var li = document.createElement('li');

    var lyrTitle = lyr.get('title');
    var lyrId = lyr.get('title').replace(' ', '-') + '_' + idx;

    var label = document.createElement('label');

    if (lyr.getLayers) {

        li.className = 'group';
        label.innerHTML = lyrTitle;
        li.appendChild(label);
        var ul = document.createElement('ul');
        li.appendChild(ul);

        this.renderLayers_(lyr, ul);

    } else {

        var input = document.createElement('input');
        if (lyr.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
        } else {
            input.type = 'checkbox';
        }
        input.id = lyrId;
        input.checked = lyr.get('visible');
        input.onchange = function() {
            this_.toggleLayer_(lyr);
        };
        li.appendChild(input);

        label.htmlFor = lyrId;
        label.innerHTML = lyrTitle;
        li.appendChild(label);

    }

    return li;

};

/**
 * Render all layers that are children of a group.
 * @private
 * @param {ol.layer.Group} lyr Group layer whos children will be rendered.
 * @param {Element} elm DOM element that children will be appended to.
 */
ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
    var lyrs = lyr.getLayers().getArray().slice().reverse();
    for (var i = 0, l; i < lyrs.length; i++) {
        l = lyrs[i];
        if (l.get('title')) {
            elm.appendChild(this.renderLayer_(l, i));
        }
    }
};

/**
 * Call the supplied function for each layer in the passed layer group
 * recursing nested groups.
 * @param {ol.layer.Group} lyr The layer group to start iterating from.
 * @param {Function} fn Callback which will be called for each ol.layer.Base
 * found under lyr. The signature for fn is the same as ol.Collection#forEach
 */
ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
    lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
            ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
        }
    });
};
;// Changes XML to JSON
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};
;(function (window, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers');

    PublicaMundi.OpenLayers.Map = PublicaMundi.Class(PublicaMundi.Map, {
        // Attempt to unify info overlays
        addOverlay: function(element) {
            popup = new ol.Overlay({
                element: element
            });
            this._map.addOverlay(popup);
            return popup;
        },
        getOverlayElement: function(popup){
            return popup.getElement();
        },
        setOverlayPosition: function(popup, pixel){
            popup.setPosition(pixel);
        },

        setExtent: function(extent, proj) {
            if (extent === null) {
                return;
            }
            var transformation;    
            if (proj == 'EPSG:4326') {
                    if (extent[0]< -180.0) {
                        extent[0] = -179.0;
                    }
                    if (extent[1] < -90.0) {
                        extent[1] = -89.0;
                    }
                    if (extent[2] > 180.0) {
                        extent[2] = 179.0;
                    }
                    if (extent[3] > 90.0) {
                        extent[3] = 89.0;
                    }
                    transformation = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

            }
            else if (proj == 'EPSG:3857'){
                transformation = extent;
            }
            else {
                transformation = null;
            }
                this._map.getView().fitExtent(transformation, this._map.getSize());
        },
        initialize: function (options) {
            PublicaMundi.Map.prototype.initialize.call(this, options);

            if ((PublicaMundi.isClass('ol.Map')) && (options instanceof ol.Map)) {
                this._map = options;
            } else {
                this._map = new ol.Map({
                    target: options.target,
                    view: new ol.View({
                        projection: options.projection,
                        center: options.center,
                        zoom: options.zoom,
                        maxZoom: options.maxZoom,
                        minZoom: options.minZoom
                    }),
                    controls: ol.control.defaults({ 
                        rotate:false}).extend([
                    ]),
                    ol3Logo: false
                });
            }
            
            this._listen();
            this._clickHandlerMap = null;
            this._clickHandlerLayer = [];
            this._clickHandlerRegisteredLayers = [];
            
            this._map.on('click', function(e) {
            });
            if ((typeof options.layers !== 'undefined') && (PublicaMundi.isArray(options.layers))) {
                for (var index = 0; index < options.layers.length; index++) {
                    this.createLayer(options.layers[index]);

                }
            }
        },
        setCenter: function (x, y) {
            if (PublicaMundi.isArray(x)) {
                this._map.getView().setCenter(x);
            } else {
                this._map.getView().setCenter([x, y]);
            }
        },
        getCenter: function () {
            return this._map.getView().getCenter();
        },
        setZoom: function (z) {
            this._map.getView().setZoom(z);
        },
        getZoom: function () {
            return this._map.getView().getZoom();
        },
        getProjection: function () {
            return this._map.getView().getProjection().getCode();
        },
        getTarget: function () {
            return this._map.getTarget();
        },
        addLayer: function (layer) {
            this._map.addLayer(layer.getLayer());
            if (PublicaMundi.isFunction(layer.getOptions().click)) {
                this._clickHandlerRegisteredLayers.push(layer);
                this._clickHandlerLayer.push(layer.getOptions().click);

                if (!PublicaMundi.isFunction(this._clickHandlerMap)) {
                    var layers = this._clickHandlerRegisteredLayers;
                    var handlers = this._clickHandlerLayer;

                    this._clickHandlerMap = function (e) {
                        var pixel = this._map.getEventPixel(e.originalEvent);
                        var features = [];

                        var processFeature = function (feature, layer) {
                            if ((layer === layers[l].getLayer()) && (layer.get("visible") === true)) {
                                var properties = {};
                                var keys = feature.getKeys();
                                var geometryName = feature.getGeometryName();
                                for (var i = 0; i < keys.length; i++) {
                                    if (keys[i] !== geometryName) {
                                        properties[keys[i]] = feature.get(keys[i]);
                                    }
                                }
                                features.push(properties);
                            }
                        };

                        for (var l = 0; l < layers.length; l++) {
                            features = [];

                            this._map.forEachFeatureAtPixel(pixel, processFeature);

                            if (features.length > 0) {
                                // on map click return handler with features and coordinate information 
                                handlers[l](features, e.coordinate);
                            }
                        }
                    };

                    // Register only once
                    this._map.on('singleclick', this._clickHandlerMap, this);
                }
            }
        

        },
        setLayerControl: function(control) {
            this._control = new ol.control.LayerSwitcher();
            this._map.getControls().extend([this._control]);

            return this._control;
        },
        _setViewBox: function() {
            var bbox = this.getExtent()[0] + ',' + this.getExtent()[1] +',' + this.getExtent()[2] +','+ this.getExtent()[3];
            this._viewbox = bbox; 
        },
        getExtent: function() {
            return this._map.getView().calculateExtent(this._map.getSize());
        },
        _listen: function() {
            var map = this;
            var idx = 0;
            //this._setLayerControl(this._map.getLayers()[0]);

            this._map.on('moveend', function() {
                map._setViewBox();
            });

        },

    });


    PublicaMundi.locator.register('PublicaMundi.Map', PublicaMundi.OpenLayers.Map);
})(window, window.PublicaMundi, ol);
;/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../../PublicaMundi.OpenLayers.js" />
/// <reference path="../Layer.js" />

(function (window, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    var extractBbox = function (bbox) {
        var bboxtemp= null;
        //$_.each(candidates, function(candidate, idx) {
        $.each(bbox, function(idx, at) {
            if(at.crs == "EPSG:4326") {
                bboxtemp = [ at.extent[1], at.extent[0], at.extent[3], at.extent[2] ];
                //return bboxfloat;
            }
            else if(at.crs == "CRS:84") {
                    console.log('is crs 84');
                    console.log(at);
                    bboxtemp = [ at.extent[0], at.extent[1], at.extent[2], at.extent[3] ];
                    //return bboxfloat;
                }
        });
        return bboxtemp;
    };


    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._map = null;
            this._type = null;
            this._layer = new ol.layer.Tile({
                title: options.title,
                visible: options.visible,
                source: new ol.source.TileWMS({
                    url: options.url,
                    params: options.params
                })
            });
            
        },
        setLayerExtent: function() {
            var layer = this;
            var options = this._options;
            if (typeof options.bbox === "undefined"){                    
                    console.log('Getting Capabilities...');
                    var parser = new ol.format.WMSCapabilities();
                    $.ajax(options.url+'?service=WMS&request=GetCapabilities').then(function(response) {
                        response = parser.read(response);
                        var candidates = response.Capability.Layer.Layer;
                        $.each(candidates, function(idx, candidate){
                            if (candidate.Name == options.params.layers){
                                bbox = extractBbox(candidate.BoundingBox);
                                layer._extent = bbox;
                                layer._layer.once('postcompose', function() {
                                        layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    });
                                //.setLayerExtent(); // rename to fitMapToExtent (for WMS, WFS if url+layer and not bbox -> GetCapabilities)
                                return false;
                                }
                         });
                   });
            }
            else{

            console.log('Direct set extent...');
            
            this._layer.once('postcompose', function() {
                console.log('postcompose');
                console.log(layer._extent);
                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            });
            }
               

        },
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WMS,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.WMS',
        factory: PublicaMundi.OpenLayers.Layer.WMS
    });
})(window, window.PublicaMundi, ol);
;/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../../PublicaMundi.OpenLayers.js" />
/// <reference path="../Layer.js" />

(function (window, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.WFS = PublicaMundi.Class(PublicaMundi.Layer, {
        update: function() {
                    },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            this._map = null;
            this._type = null;
            var version = options.params.version ? '&version=' + options.params.version : '';
            var maxFeatures = options.params.maxFeatures ? '&maxFeatures='+options.params.maxFeatures : '';
            
            
            // Set JSON as preferable transfer format
            var output_format = options.params.format ? options.params.format : 'json';
            var format; 

            // Set v2 as default version for GML
            if (output_format =='gml'){
                output_format = 'gml2';
            }
            
            if (output_format == 'json') {
                format = new ol.format.GeoJSON();
            }
            else if (output_format == 'gml32' || output_format == 'gml31' || output_format == 'gml3'){
                format = new ol.format.WFS({
                             //   featureNS: undefined,
                             //  featureType:  undefined, //'og:archsites',
                            gmlFormat: new ol.format.GML3(),
                            extractAttributes: true,
                            resFactor: 1,
                        });
            }
            else if (output_format == 'gml2'){
                format = new ol.format.WFS({
                             //   featureNS: undefined,
                             //  featureType:  undefined,
                            gmlFormat: new ol.format.GML2(),
                            //extractAttributes: true
                        });
            }

            //var version = options.version || '1.0.0';
           var projection = options.params.projection ? options.params.projection : 'EPSG:3857'; 

            if (projection == 'EPSG:900913'){
                projection = 'EPSG:3857';
            }
            else if ( projection == 'EPSG:26713'){
                    projection = 'EPSG:3857';
                }
            var name = options.params.layers;
                 var vectorSource = new ol.source.ServerVector({
                    format: format,
                    projection: projection,
                    //strategy: function() {
                    //                    return [ [-8473015.930372493, 5673984.22207263, -8430593.37967422, 5704559.033386701] ];
                    //                                    },
                    //strategy: ol.loadingstrategy.bbox,
                    strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
                        //maxZoom: 19,
                        //minZoom: 8
                    })),

                    loader: function(extent, resolution, proj) {
                        $.ajax({
                            type: "GET",
                            //url: options.url+  '?service=WFS&request=GetFeature&typename='+options.name+'&srsname=EPSG:4326&outputFormat=json' +
                            url: options.url+  '?service=WFS&request=GetFeature&typename='+name+ '&srsname='+projection + '&outputFormat='+ output_format +  '&bbox=' + extent.join(',')+ ',EPSG:3857' +  maxFeatures + version,
                            //'&maxFeatures=' + options.maxFeatures + '&version=' + version 
                            //'&format_options=callback:loadFeatures',
                            //dataType: 'jsonp',
                            //dataType: 'json',
                            //outputFormat: 'json',
                            //dataType: 'xml',
                            
                            //context: this,
                            success: function(response) {
                                loadFeatures(response);
                            },
                            failure: function(response) {
                                console.log(response);
                            }
                        } );

                     },
            });

            var loadFeatures = function(response) {
                //console.log(response);

                //console.log('projection');
                //console.log(projection);
                //console.log('format');
                //console.log(output_format);
                //console.log('version');
                //console.log(version);

                //var proj = { dataProjection: 'EPSG:900913', featureProjection: 'EPSG:900913'};
                //console.log(projection);
                var proj = { dataProjection: projection, featureProjection: 'EPSG:3857'};
                //var proj = {};
                //console.log(vectorSource.readFeatures(response,  proj));
                //console.log(format.readFeatures(response, proj));
                //console.log(format.readFeatures(response)[0].values_.boundedBy);
                //console.log(format.readFeatures(response , proj));
                //console.log(format.readFeatures(response, proj));
                vectorSource.addFeatures(format.readFeatures(response));
                //console.log(format);
                //vectorSource.addFeatures(format.readFeatures(response));
                };

            this._layer = new ol.layer.Vector({
                title: options.title,
                source: vectorSource, 
                visible: options.visible,
                                projection: projection,
                //projection: 'EPSG:3857',
               // })
            });
        
        
            
        },
        setLayerExtent: function() {
        
            var layer = this;
            var options = this._options;

            if (typeof options.bbox === "undefined"){                    
                    console.log('Getting Capabilities...');
                    
                    $.ajax(options.url+"?service=WFS&request=GetCapabilities").then(function(response) {
                            
                        response = xmlToJson(response);
                        console.log(response);
                        var candidates = response['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType;
                        $.each(candidates, function(idx, candidate) {
                            console.log(options.params.layers);
                            if (candidate.Name){
                            if (candidate.Name["#text"]){
                            if (candidate.Name["#text"] == options.params.layers){
                                    console.log('FOUND');
                                    
                                    var bbox = candidate.WGS84BoundingBox;
                                    var lc = null;
                                    var uc = null;
                                    if (typeof bbox === "undefined") {
                                        bbox = candidate["ows:WGS84BoundingBox"];
                                        lc = bbox['ows:LowerCorner']["#text"];
                                        uc = bbox['ows:UpperCorner']["#text"];
                                    }
                                    else {
                                        lc = bbox.LowerCorner["#text"];
                                        uc = bbox.UpperCorner["#text"];
                                    }
                                    
                                    if (typeof bbox !== "undefined") {
                                        lc = lc.split(' ');
                                        uc = uc.split(' ');
                                        bboxfloat = [ parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]) ];
                                    }
                                    layer._extent = bboxfloat;
                                    layer._layer.once('postcompose', function() {
                                        layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    });
                                    return false;
                                    }}}
                   });
                   });
            }
            else{

            console.log('Direct set extent...');
            
            this._layer.once('postcompose', function() {
                console.log('postcompose');
                console.log(layer._extent);
                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            });
            }

        },
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WFS,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.WFS',
        factory: PublicaMundi.OpenLayers.Layer.WFS
    });
})(window, window.PublicaMundi, ol);
;(function (global, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.Tile = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._layer = new ol.layer.Tile({
                title: options.title,
                type: 'base', 
                source: new ol.source.XYZ({
                    url: options.url
                })
            });
            var urls = [];
            if (options.url.indexOf('{s}') < 0) {
                urls.push(options.url);
            } else {
                var subdomains = options.subdomains || 'abc';

                if (!PublicaMundi.isArray(subdomains)) {
                    subdomains = subdomains.split('');
                }
                for (var index = 0; index < subdomains.length; index++) {
                    urls.push(options.url.replace('{s}', subdomains[index]));
                }
            }
            this._layer.getSource().setUrls(urls);
        }
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.TILE,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.Tile',
        factory: PublicaMundi.OpenLayers.Layer.Tile
    });
})(window, window.PublicaMundi, ol);
;/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.KML = PublicaMundi.Class(PublicaMundi.Layer, {
        
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._layer = new ol.layer.Vector({
                title: options.title,
                source: new ol.source.KML({
                    extractStyles: false,
                    projection: options.projection,
                    url: options.url
                }),
               /* style: new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: 'rgba(255,255,255,0.4)'}),
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(51,153,204, 1)',
                            width: 1.25})
                        })
                })*/
            });
        },
        setLayerExtent: function() {
            var layer = this;
            this._layer.once('postcompose', function() {
                layer._extent = this.getSource().getExtent();
                layer.getMap().setExtent(layer._extent, 'EPSG:3857');
            });
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.KML,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.KML',
        factory: PublicaMundi.OpenLayers.Layer.KML
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.KML = function (options) {
            options.type = options.type || PublicaMundi.LayerType.KML;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, ol);
;/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.GeoJson = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._layer = new ol.layer.Vector({
                title: options.title,
                source: new ol.source.GeoJSON({
                    projection: options.projection,
                    url: options.url
                }),
            });
           },
        setLayerExtent: function() {
            var layer = this;
            this._layer.once('postcompose', function() {
                layer._extent = this.getSource().getExtent();
                layer.getMap().setExtent(layer._extent, 'EPSG:3857');
            });
        },
        
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.GeoJSON,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.GeoJson',
        factory: PublicaMundi.OpenLayers.Layer.GeoJson
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.geoJSON = function (options) {
            options.type = options.type || PublicaMundi.LayerType.GeoJSON;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, ol);

//# sourceMappingURL=publicamundi.ol-src.js.map