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
        onLayerLoad: function(cb) {
            this._layer.once('load', function(e) {
                cb.call();
            });
        },        
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            this._layer.once('load', function(e) {
                if (typeof options.bbox !== "undefined"){                    
                    layer.getMap().setExtent(options.bbox, 'EPSG:4326');
                }
                // otherwise ask the server for the layer bbox
                else{
                    console.log('FITTING ELSE');
                    var parser = PublicaMundi.parser();
                    var url  = options.url + '?service=WMS&request=GetCapabilities';
                    console.log(options.url);
                    $.ajax({
                        url: url,
                        success: function(response) {
                            var result = parser.parseWMS(response);
                            var layers = result.Layer;
                            console.log('SUCCS');
                            console.log(result); 
                            for (var idx in layers){
                                var candidate = layers[idx];
                                if (candidate.Name == options.params.layers){
                                    //layer._extent = candidate.WGS84BoundingBox;
                                    layer._extent = candidate.EX_GeographicBoundingBox;
                                    console.log('LAYER FOUND');
                                    console.log(layer._extent);
                                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    //layer._layer.once('postcompose', function() {
                                    //        layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    //});
                                    return false;
                                }
                            };
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
