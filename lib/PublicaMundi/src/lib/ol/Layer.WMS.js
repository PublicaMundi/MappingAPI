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

    var extractBbox = function (bbox) {
        var bboxtemp= null;
        $.each(bbox, function(idx, at) {
            if(at.crs == "EPSG:4326") {
                bboxtemp = [ at.extent[1], at.extent[0], at.extent[3], at.extent[2] ];
            }
            else if(at.crs == "CRS:84") {
                    bboxtemp = [ at.extent[0], at.extent[1], at.extent[2], at.extent[3] ];
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
        fitToMap: function() {
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
                                return false;
                                }
                         });
                   });
            }
            else{

            console.log('Bbox option found');
            
            this._layer.once('postcompose', function() {
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
