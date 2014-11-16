/* PublicaMundi Mapping API version 0.1.0 2014-10-27 */
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


})(window, PublicaMundi);;(function (window, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers');

    PublicaMundi.OpenLayers.Map = PublicaMundi.Class(PublicaMundi.Map, {
        initialize: function (options) {
            PublicaMundi.Map.prototype.initialize.call(this, options);

            if ((PublicaMundi.isClass('ol.Map')) && (options instanceof ol.Map)) {
                this._map = options;
            } else {
                this._map = new ol.Map({
                    target: options.target,
                    view: new ol.View2D({
                        projection: options.projection,
                        center: options.center,
                        zoom: options.zoom
                    }),
                    controls: ol.control.defaults().extend([
                    ]),
                    ol3Logo: false
                });
            }

            this._clickHandlerMap = null;
            this._clickHandlerLayer = [];
            this._clickHandlerRegisteredLayers = [];

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
                                handlers[l](features);
                            }
                        }
                    };

                    // Register only once
                    this._map.on('singleclick', this._clickHandlerMap, this);
                }
            }
        }
    });


    PublicaMundi.locator.register('PublicaMundi.Map', PublicaMundi.OpenLayers.Map);
})(window, window.PublicaMundi, ol);;/// <reference path="../../../OpenLayers/build/ol-whitespace.js" />
/// <reference path="../../PublicaMundi.js" />
/// <reference path="../../Layer.js" />
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
                source: new ol.source.TileWMS({
                    url: options.url,
                    params: options.params
                })
            });
        }
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WMS,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.WMS',
        factory: PublicaMundi.OpenLayers.Layer.WMS
    });
})(window, window.PublicaMundi, ol);;(function (global, PublicaMundi, ol) {
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
})(window, window.PublicaMundi, ol);;(function (global, PublicaMundi, ol) {
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
                })
            });
        }
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