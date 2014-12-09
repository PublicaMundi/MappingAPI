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

    // Helpers

    var extractBbox = function (bbox) {
        var bboxtemp= null;
        $.each(bbox, function(idx, at) {
            at = at['@attributes'];
            if(at.CRS == "EPSG:4326") {
                bboxtemp = [ parseFloat(at.miny), parseFloat(at.minx), parseFloat(at.maxy) , parseFloat(at.maxx) ];
            }
            else if(at.CRS == "CRS:84") {
                bboxtemp = [ parseFloat(at.minx), parseFloat(at.miny), parseFloat(at.maxx), parseFloat(at.maxy) ];
                }
        });
        return bboxtemp;
    };


    PublicaMundi.define('PublicaMundi.Leaflet.Layer');

    PublicaMundi.Leaflet.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        _addToControl: function() { 
            var map = this._map;
            var title = this._options.title;
              if (map.getLayerControl()){
                map.getLayerControl().addOverlay(this._layer, title);
                }
            },
        
        //fitToMap: function() {
        //    var layer = this;
            //this._layer.on('load', function() {
            //    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            //});
        //},
        fitToMap: function() {
            
            ///
            
            var layer = this;
            var options = this._options;
            

            if (typeof options.bbox === "undefined"){                    
                    console.log('Getting Capabilities...');
                    
                    //$.ajax(options.url+"?service=WFS&request=GetCapabilities").then(function(response) {
                    $.ajax(options.url+'?service=WMS&request=GetCapabilities').then(function(response) {
                            
                        response = xmlToJson(response);
                        console.log(response);
                        var candidates = response.WMS_Capabilities.Capability.Layer.Layer;
                        $.each(candidates, function(idx, candidate) {
                            if (candidate.Name){
                            if (candidate.Name["#text"]){
                            if (candidate.Name["#text"] == options.params.layers){
                                    var bbox = extractBbox(candidate.BoundingBox);
                                    
                                    layer._extent = bbox;
                                    layer._layer.on('load', function() {
                                        layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    });

                                    //layer._layer.once('postcompose', function() {
                                    //    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    //});
                                    return false;
                                    }}}
                   });
                   });
            }

            
            ////

            else{

            console.log('Bbox option found');
            
            this._layer.once('postcompose', function() {
                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            });
            }
               

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
