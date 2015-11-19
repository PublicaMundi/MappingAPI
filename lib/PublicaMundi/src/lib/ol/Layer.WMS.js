/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

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

