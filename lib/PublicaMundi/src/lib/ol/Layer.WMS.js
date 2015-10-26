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

    /*var extractBbox = function (bbox) {
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
    */

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            
            console.log('in wms');
            console.log(options);
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
        onLayerLoad: function(cb) {
            //this._layer.getSource().once('tileloadend', function(event) {
            this._layer.on('change:visible', function(event) {
                console.log('change visible');
                console.log(event);
                if (event.oldValue == false){
                    cb.call();
                }
            });
        }, 
        fitToMap: function() {
            var layer = this;
            var options = this._options;
         
            // if bbox parameter is provided use it for layer extent
            
            if (typeof layer._extent !== "undefined"){
                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            }
            else{
                if (typeof options.bbox !== "undefined"){                    

                    console.log('Bbox option found');
                
                    this._layer.once('postcompose', function() {
                    //this._layer.on('change', function(e) {
                    //layer._layer.on('change', function(e) {
                        layer._extent = options.bbox;
                        layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                    });
                    //layer.getMap().setExtent(layer._extent, options.bbox_crs || 'EPSG:4326');
                    // TODO: need to zoom in some more if zoomin option provided
                    // if (options.zoomin){
                        //console.log('zoomin option found');
                        //layer.getMap().setZoom(layer.getMap().getZoom()+1.5);
                    // }
                //  });
                }
                // otherwise ask the server for the bbox
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
                                };
                            }
                        });
                }
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
