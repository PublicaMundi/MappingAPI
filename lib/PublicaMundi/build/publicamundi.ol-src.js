/* PublicaMundi Mapping API version 0.1.0 2015-11-19 */
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
 * See [the examples](./examples) for usage.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:
 *                              **`tipLabel`** `String` - the button tooltip.
 */
ol.control.LayerSwitcher = function(opt_options) {

    var options = opt_options || {};

    var tipLabel = options.tipLabel ?
      options.tipLabel : 'Legend';

    this.mapListeners = [];

    this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
    this.shownClassName = this.hiddenClassName + ' shown';

    var element = document.createElement('div');
    element.className = this.hiddenClassName;

    var button = document.createElement('button');
    button.setAttribute('title', tipLabel);
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
 * Show the layer panel.
 */
ol.control.LayerSwitcher.prototype.showPanel = function() {
    if (this.element.className != this.shownClassName) {
        this.element.className = this.shownClassName;
        this.renderPanel();
    }
};

/**
 * Hide the layer panel.
 */
ol.control.LayerSwitcher.prototype.hidePanel = function() {
    if (this.element.className != this.hiddenClassName) {
        this.element.className = this.hiddenClassName;
    }
};

/**
 * Re-draw the layer panel to represent the current state of the layers.
 */
ol.control.LayerSwitcher.prototype.renderPanel = function() {

    this.ensureTopVisibleBaseLayerShown_();

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
    if (map) {
        var this_ = this;
        this.mapListeners.push(map.on('pointerdown', function() {
            this_.hidePanel();
        }));
        this.renderPanel();
    }
};

/**
 * Ensure only the top-most base layer is visible if more than one is visible.
 * @private
 */
ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
    var lastVisibleBaseLyr;
    ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
        if (l.get('type') === 'base' && l.getVisible()) {
            lastVisibleBaseLyr = l;
        }
    });
    if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
};

/**
 * Toggle the visible state of a layer.
 * Takes care of hiding other layers in the same exclusive group if the layer
 * is toggle to visible.
 * @private
 * @param {ol.layer.Base} The layer whos visibility will be toggled.
 */
ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible) {
    var map = this.getMap();
    lyr.setVisible(visible);
    if (visible && lyr.get('type') === 'base') {
        // Hide all other base layers regardless of grouping
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l != lyr && l.get('type') === 'base') {
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
    var lyrId = lyr.get('title').replace(/\s+/g, '-') + '_' + idx;

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
        input.onchange = function(e) {
            this_.setVisible_(lyr, e.target.checked);
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
 * **Static** Call the supplied function for each layer in the passed layer group
 * recursing nested groups.
 * @param {ol.layer.Group} lyr The layer group to start iterating from.
 * @param {Function} fn Callback which will be called for each `ol.layer.Base`
 * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
 */
ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
    lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
            ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
        }
    });
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
                    interactions: options.interactions,
                    ol3Logo: false
                });
            }
            if (options.layerControl){
                this.setLayerControl();
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
            
            if (layer.getOptions().fitToMap){
                layer.fitToMap();
            }
            
            var helpers = PublicaMundi.helpers(); 
            
            if (PublicaMundi.isFunction(layer.getOptions().click)) {
                this._clickHandlerRegisteredLayers.push(layer);
                this._clickHandlerLayer.push(layer.getOptions().click);
                                
                this._featureOverlay = new ol.FeatureOverlay({
                    map: this._map,
                    //style: sstyle,
                });
                    
                if (!PublicaMundi.isFunction(this._clickHandlerMap)) {
                    var layers = this._clickHandlerRegisteredLayers;
                    var handlers = this._clickHandlerLayer;
                    var map = this._map;
                    var self = this;
                    this._clickHandlerMap = function (e) {
                        var pixel = this._map.getEventPixel(e.originalEvent);
                        var features = [];
                        if (map._highlight){
                            self._featureOverlay.removeFeature(map._highlight);
                            map._highlight = undefined;
                        }
                        var processFeature = function (feature, layer) {
                            if ((layer === layers[l].getLayer()) && (layer.get("visible") === true)) {
                                var llayer = layers[l];

                                var style = llayer._style;
                                // change feature overlay style if layer style highlight is set
                                //var highlight = llayer._style.highlight;
                                var highlight = null;

                                if (!PublicaMundi.isFunction(style.highlight)){

                                    highlight = helpers._transformStyle(style.highlight);
                                    self._featureOverlay.setStyle(highlight);
                                }
                                else{
                                    self._featureOverlay.setStyle(style.highlight);
                                }

                                if (map._highlight){
                                    if (map._highlight !== feature){
                                        self._featureOverlay.removeFeature(map._highlight);
                                        map._highlight = feature;
                                        self._featureOverlay.addFeature(feature);
                                    }
                                }
                                else{
                                    map._highlight = feature;
                                    self._featureOverlay.addFeature(feature);
                                }
                                 
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
        removeLayer: function (layer) {
            if(layer) {
                this._map.removeLayer(layer.getLayer());
                for(var i=0; i < this._layers.length; i++) {
                    if (this._layers[i] == layer) {
                        this._layers.splice(i,1);
                        break;
                    }
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
;(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Helpers');

    PublicaMundi.OpenLayers.Helpers = PublicaMundi.Class(PublicaMundi.Helpers, {
        initialize: function () {
        },
        _getDefaultStyle: function(style, defaultStyle){
                if (!style && !defaultStyle){
                   return {};
                }
                /*if (PublicaMundi.isFunction(style)){ 
                    return style;
                    //return {};
                    //return jQuery.extend({}, style);
                }
                if (PublicaMundi.isFunction(defaultStyle)){
                    return defaultStyle;
                    //return {};
                    //return jQuery.extend({}, defaultStyle);
                }
                */
                var tstyle = {};

                tstyle.color = (style.color || defaultStyle.color) || 'rgba(0,255,0)';
                tstyle.opacity = style.opacity || defaultStyle.opacity || 1;
                tstyle.fillColor = style.fillColor || defaultStyle.fillColor || 'rgba(255,255,0)';
                tstyle.fillOpacity = style.fillOpacity || defaultStyle.fillOpacity || 1;
                tstyle.weight = style.weight || defaultStyle.weight || 1;
                tstyle.radius = style.radius || defaultStyle.radius || 6;
                
                return tstyle;
           },
        _transformStyle: function(style){
                if (!style){
                   return {};
                } 
                /*
                if (PublicaMundi.isFunction(style)){ 
                    return {};
                    //return jQuery.extend({}, style);
                }
                */
                var tstyle = {};
                //tstyle.color = style ? this._hexToRgba(style.color, style.opacity) : 'rgba(0,255,0,1)';
                //tstyle.fillColor = style ? this._hexToRgba(style.fillColor, style.fillOpacity) : 'rgba(0,255,0,1)';
                //tstyle.weight = style ? style.weight : 1;
                //tstyle.radius = style ? style.radius : 6;
                tstyle.color = this._hexToRgba(style.color, style.opacity);
                tstyle.fillColor = this._hexToRgba(style.fillColor, style.fillOpacity);
                tstyle.weight = style.weight;
                tstyle.radius = style.radius;

                return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: tstyle.color,
                            width: tstyle.weight,
                        }),
                        fill: new ol.style.Fill({
                            color: tstyle.fillColor,
                            }),
                        image: new ol.style.Circle({
                            radius: tstyle.radius,
                            stroke: new ol.style.Stroke({
                                color: tstyle.color,
                                width: tstyle.weight,
                            }),
                            fill: new ol.style.Fill({
                                color: tstyle.fillColor,
                                }),
                            })
                    });

        },
        _hexToRgba: function(color, opacity){
            var tcolor = color;
            var topacity = opacity; 
            if (color){
                if (color.indexOf('#') === 0){
                        tcolor = ol.color.asArray(tcolor);
                        tcolor = tcolor.slice();
                        tcolor[3] = opacity;  // change the alpha of the color 
                        tcolor = ol.color.asString(tcolor);
                    }
            }
            return tcolor;
        },
    });

    PublicaMundi.locator.register('PublicaMundi.Helpers', PublicaMundi.OpenLayers.Helpers);

    PublicaMundi.helpers = function () {
        return PublicaMundi.locator.create('PublicaMundi.Helpers');
    };
})(window, PublicaMundi);
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

    PublicaMundi.OpenLayers.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._map = null;
            this._type = null;
            this._layer = new ol.layer.Tile({
                title: options.title,
                type: options.switcher, 
                visible: options.visible,
                source: new ol.source.TileWMS({
                    url: options.url,
                    params: options.params
                })
            });
        },
        // TODO: not yet supported
        onLayerLoad: function(cb) {
            //this._layer.getSource().once('tileloadend', function(event) {
            this._layer.on('change:visible', function(event) {
                if (event.oldValue === false){
                    cb.call();
                }
            });
        },
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            // if bbox parameter is provided use it for layer extent
            if (layer._extent !== null){
                layer._layer.once('postcompose', function() {
                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                });
            }
            else{
                    //layer.getMap().setExtent(layer._extent, options.bbox_crs || 'EPSG:4326');
                    // TODO: need to zoom in some more if zoomin option provided
                    // if (options.zoomin){
                        //layer.getMap().setZoom(layer.getMap().getZoom()+1.5);
                    // }
                //  });
                // otherwise ask the server for the bbox
                    var parser = PublicaMundi.parser();
                    var url  = options.url + '?service=WMS&request=GetCapabilities';
                    $.ajax({
                        url: url,
                        success: function(response) {
                            var result = parser.parseWMS(response);
                            var layers = result.Layer;

                            for (var idx in layers){
                                    var candidate = layers[idx];
                                    if (candidate.Name == options.params.layers){
                                        layer._extent = candidate.EX_GeographicBoundingBox;

                                        layer._layer.once('postcompose', function() {
                                        //       layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                        //layer._layer.on('change', function(e) {
                                        //layer._layer.once('postcompose', function() {
                                                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                        });
                                        //    });
                                        return false;
                                    }
                                }
                            }
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
 
            options.style = options.style || {normal:{}, highlight:{}}; 
            options.style.normal = options.style.normal || {}; 
            options.style.highlight = options.style.highlight || {}; 

            var style = this._style.normal;
            var helpers = PublicaMundi.helpers();

            if (PublicaMundi.isFunction(options.style.normal)){
                this._style.normal = options.style.normal;
                style = this._style.normal;
            }
            else{
                this._style.normal = helpers._getDefaultStyle(options.style.normal, this._style.normal);
                style = helpers._transformStyle(this._style.normal);
            }
            if (PublicaMundi.isFunction(options.style.highlight)){
                this._style.highlight = options.style.highlight;
            }
            else{
                this._style.highlight = helpers._getDefaultStyle(options.style.highlight, this._style.normal);
            }
            var version = options.params.version;
            var maxFeatures = options.params.maxFeatures;
            
            // Set JSON as preferable transfer format
            var output_format = options.params.format || 'json';
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
           var projection = options.params.projection || 'EPSG:3857'; 

            if (projection == 'EPSG:900913'){
                projection = 'EPSG:3857';
            }
            else if ( projection == 'EPSG:26713'){
                    projection = 'EPSG:3857';
                }
            
            var name = options.params.layers;
                //var vectorSource = new ol.source.Vector({
                /*
                var vectorSource = new ol.source.ServerVector({
                format: format,
                projection: projection,
                //dataType: 'jsonp',
                 //var vectorSource = new ol.source.Vector({
                 */
                 var vectorSource = new ol.source.Vector({
                    format: format,
                    projection: projection,
                    //dataType: 'jsonp',
                     //strategy: ol.loadingstrategy.bbox,
                    //strategy: ol.loadingstrategy.tile(new ol.tilegrid.createXYZ({
                    strategy: ol.loadingstrategy.tile(new ol.tilegrid.XYZ({
                        //maxZoom: 19,
                        //minZoom: 8
                    })),
                    //strategy: ol.loadingstrategy.bbox,
                //strategy: ol.loadingstrategy.tile(new ol.tilegrid.createXYZ({
                //strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
                    //maxZoom: 19,
                    //minZoom: 8
                //})),
                //strategy: ol.loadingstrategy.bbox,
                loader: function(extent, resolution, proj) {
                    var params = {
                            service: 'WFS',
                            request: 'GetFeature',
                            typename: name,
                            srsname: projection,
                            outputFormat: output_format,
                            bbox: extent.join(',')+ ',EPSG:3857',
                            version: version,
                        };
                    var maxFeaturesParam = 'maxFeatures';
                    if (version === '2.0.0'){
                        maxFeaturesParam = 'count';
                    }
                    params[maxFeaturesParam] = maxFeatures;

                    $.ajax({
                        type: "GET",
                        url: options.url,
                        data: params,                  
                        async: true, 
                        //dataType: 'jsonp',
                        beforeSend: function(){
                            //$('.loading-spinner').css({'display':'block'});
                        },
                        complete: function(){
                            //$('.loading-spinner').css({'display':'none'});
                        },
                        success: function(response) {
                            loadFeatures(response);
                            $.event.trigger({
                                type: "layerLoaded",
                            });

                        },
                        failure: function(response) {
                            console.log('response');
                            console.log(response);
                        }
                    } );
                    },
            });

            var loadFeatures = function(response) {
                var proj = { dataProjection: projection, featureProjection: 'EPSG:3857'};
                vectorSource.addFeatures(format.readFeatures(response));
                
            };

            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                source: vectorSource, 
                visible: options.visible,
                projection: projection,
                style: style,
            });
        
        },
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            // if bbox option is provided use it for the layer extent
            if (layer._extent !== null){
                layer._layer.once('postcompose', function() {
                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                });
            }
            // otherwise ask the server for the layer bbox
            else{
                var parser = PublicaMundi.parser();
                var url  = options.url + '?service=WFS&request=GetCapabilities';
                $.ajax({
                    url: url,
                    success: function(response) {
                        var result = parser.parseWFS(response);
                        var layers = result.Layer;
                        
                        for (var idx in layers){
                                var candidate = layers[idx];
                                if (candidate.Name == options.params.layers){
                                    layer._extent = candidate.WGS84BoundingBox;
                                    layer._layer.once('postcompose', function() {
                                            layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                        });
                                    return false;
                                }
                            }
                        }
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
            this._layer = new ol.layer.Tile({
                title: options.title,
                type: options.switcher || 'base', 
                source: new ol.source.XYZ({
                    urls: urls
                })
            });
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

            options.style = options.style || {normal:{}, highlight:{}};
            options.style.normal = options.style.normal || {};
            options.style.highlight = options.style.highlight || {};

            var style = this._style.normal;
            var helpers = PublicaMundi.helpers();

            if (PublicaMundi.isFunction(options.style.normal)){
                this._style.normal = options.style.normal;
                style = this._style.normal;
            }
            else{
                this._style.normal = helpers._getDefaultStyle(options.style.normal, this._style.normal);
                style = helpers._transformStyle(this._style.normal);
            }
            if (PublicaMundi.isFunction(options.style.highlight)){
                this._style.highlight = options.style.highlight;
            }
            else{
                this._style.highlight = helpers._getDefaultStyle(options.style.highlight, this._style.normal);
            }
            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                visible: options.visible,
                source: new ol.source.Vector({
                    projection: options.projection,
                    format: new ol.format.KML({
                        extractStyles: false
                    }),
                    url: options.url
                }),
                style: style,
            });
        },
        // TODO: not yet supported
        fitToMap: function() {
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
            options.type = PublicaMundi.LayerType.KML;

            return this.createLayer(options);
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

    PublicaMundi.OpenLayers.Layer.GML = PublicaMundi.Class(PublicaMundi.Layer, {
        
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

           
            var projection = options.projection ? options.projection : 'EPSG:3857'; 

            if (projection == 'EPSG:900913'){
                projection = 'EPSG:3857';
            }
            else if ( projection == 'EPSG:26713'){
                    projection = 'EPSG:3857';
                }
            
            var format = new ol.format.WFS({
                                    //featureNS: 'ogr',
                                    //featureType: 'poi_thessalonikis',
                                    //featureNS: (options.featureNS ? layer.featureNS : undefined),
                                    //featureType: (options.featureType ? layer.featureType : undefined),
                                    gmlFormat: new ol.format.GML3(),
                                    extractAttributes: 'False',
                                    //geometryName: 'geometryProperty'
            });

            var vectorSource = new ol.source.ServerVector({
            //var vectorSource = new ol.source.StaticVector({
                    //format: new ol.format.GeoJSON(),
                    format: format,
                    projection: projection,
                    //url: options.url,
                    //projection: 'EPSG:3857',
                     //url: options.url,
                    //strategy: ol.loadingstrategy.bbox,
                   // strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({

                loader: function(extent, resolution, proj) {
                    $.ajax({
                        type: "GET",
                        url: options.url,
                        //url: options.url+  '?service=WFS&request=GetFeature&typename='+options.name+'&srsname=EPSG:4326&outputFormat=json' +
                        //url: options.url+  '?service=WFS&request=GetFeature&typename='+options.name+ '&srsname='+projection + '&outputFormat='+ output_format +  '&bbox=' + extent.join(',')+ ',EPSG:3857' + '&maxFeatures=' + options.maxFeatures + '&version=1.1.0',
                        //'&maxFeatures=' + options.maxFeatures + '&version=' + version 
                        //'&format_options=callback:loadFeatures',
                        //dataType: 'jsonp',
                        //dataType: 'json',
                        //outputFormat: 'json',
                        //dataType: 'xml',
                        success: function(response) {
                            loadFeatures(response);
                        },
                        failure: function(response) {
                            //console.log('FAILURE');
                            //console.log(response);
                        }
                    } );

                     }, 
                    });
            console.log('vectorSource');
            console.log(vectorSource);
            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                source: vectorSource, 
                //visible: options.visible,
                visible: true,
                projection: projection,
                });

            var loadFeatures = function(response) {
                //var proj = { dataProjection: 'EPSG:900913', featureProjection: 'EPSG:900913'};
                var proj = { dataProjection: 'EPSG:2100', featureProjection: 'EPSG:2100'};
                //var proj = {};
                //console.log(vectorSource.readFeatures(response,  proj));
                //console.log(vectorSource.readFeatures(response));
                //vectorSource.addFeatures(vectorSource.readFeatures(response));
                vectorSource.addFeatures(vectorSource.readFeatures(response));
                };


        },
        fitToMap: function() {
            var layer = this;
            this._layer.once('postcompose', function() {
                layer._extent = this.getSource().getExtent();
                layer.getMap().setExtent(layer._extent, 'EPSG:3857');
            });
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.GML,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.GML',
        factory: PublicaMundi.OpenLayers.Layer.GML
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.GML = function (options) {
            options.type = PublicaMundi.LayerType.GML;

            return this.createLayer(options);
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

            options.style = options.style || {normal:{}, highlight:{}};
            options.style.normal = options.style.normal || {};
            options.style.highlight = options.style.highlight || {};

            var style = this._style.normal;
            var helpers = PublicaMundi.helpers();

            if (PublicaMundi.isFunction(options.style.normal)){
                this._style.normal = options.style.normal;
                style = this._style.normal;
            }
            else{
                this._style.normal = helpers._getDefaultStyle(options.style.normal, this._style.normal);
                style = helpers._transformStyle(this._style.normal);
            }
            if (PublicaMundi.isFunction(options.style.highlight)){
                this._style.highlight = options.style.highlight;
            }
            else{
                this._style.highlight = helpers._getDefaultStyle(options.style.highlight, this._style.normal);
            }

            var source = null;

            if(options.url) {
                source = new ol.source.Vector({
                    projection: options.projection,
                    url: options.url
                });
            } else if (options.text) {
                var format = new ol.format.GeoJSON();
                var features = format.readFeatures(JSON.parse(options.text), {
                    dataProjection: options.projection,
                    featureProjection: PublicaMundi.Maps.CRS.Mercator
                });

                source = new ol.source.GeoJSON({
                    projection: options.projection
                });
                source.addFeatures(features);
            } else if (options.data) {
                var format = new ol.format.GeoJSON();
                var features = format.readFeatures(options.data, {
                    dataProjection: options.projection,
                    featureProjection: 'EPSG:3857'
                });

                source = new ol.source.Vector({
                    projection: options.projection
                });
                source.addFeatures(features)
            }

            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                visible: options.visible,
                source: source,
                style: style
            });
           },
        // TODO: not yet supported
        fitToMap: function() {
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
            options.type = PublicaMundi.LayerType.GeoJSON;
            return this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, ol);

//# sourceMappingURL=publicamundi.ol-src.js.map