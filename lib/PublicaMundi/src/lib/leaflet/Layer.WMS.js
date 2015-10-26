/// <reference path="../../../Leaflet/leaflet-src.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, L) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.Leaflet.Layer');

    PublicaMundi.Leaflet.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        _addToControl: function() { 
            var map = this._map;
            var title = this._options.title;
              if (map.getLayerControl()){
                map.getLayerControl().addOverlay(this._layer, title);
                }
        },
        // TODO: not yet supported
        onLayerLoad: function() {
        },        
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            this._layer.once('load', function(e) {
                if (typeof options.bbox !== "undefined"){                    
                    layer.getMap().setExtent(options.bbox, 'EPSG:4326');
                }
                else{
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
                                    //layer._extent = candidate.WGS84BoundingBox;
                                    layer._extent = candidate.EX_GeographicBoundingBox;
                                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    return false;
                                }
                            }
                        }
                    });
                }
            });
        },

        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            this._layer = L.tileLayer.wms(options.url, {
                layers: options.params.layers,
                format: 'image/png',
                transparent: true
            });
        },
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WMS,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.WMS',
        factory: PublicaMundi.Leaflet.Layer.WMS
    });
})(window, window.PublicaMundi, L);
