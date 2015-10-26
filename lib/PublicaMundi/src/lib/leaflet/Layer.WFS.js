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

    PublicaMundi.Leaflet.Layer.WFS = PublicaMundi.Class(PublicaMundi.Layer, {
        _addToControl: function() {
            var map = this._map;
            var title = this._options.title;
            if (map.getLayerControl()){
                map.getLayerControl().addOverlay(this._layer, title);
            }
        },
        fitToMap: function() {
            var layer = this;
            //var bounds = L.latLngBounds([]); 
                //var currextent = layer._layer.getBounds();
                //layer._map._map.fitBounds(currextent);
            
             var options = this._options;
            /*
            $(document).one("layerLoaded2", function(){
            if (typeof options.bbox !== "undefined"){                    
                //this._layer.once('postcompose', function() {
                //$(document).on("layerLoaded", function(){
                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                //});
                //});
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
                                //layer._extent = candidate.EX_GeographicBoundingBox;
                                console.log('LAYER FOUND wFS');
                                console.log(layer._extent);
                                //$(document).on("layerLoaded", function(){
                                    //layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                //});

                                //layer._layer.once('postcompose', function() {
                                //});
                                return false;
                            }
                        };
                    }
                });
            } 
        //$(document).unbind("layerLoaded");
        });
            */

            this._layer.once('layeradd', function(){
                this._map.setExtent(layer._extent, 'EPSG:4326');
            });
        },
        update: function() { 
            //set initial view box
            if (this._map._getViewBox()=='0,0,0,0'){
                this._map._setViewBox();
                }

            var bbox = this._map._getViewBox();
            $.ajax({
                type: "GET",
                url: this._options.url,
                data:{
                    service: 'WFS',
                    request: 'GetFeature',
                    typename: this._options.params.layers,
                    srsname: 'EPSG:4326',
                    outputFormat: 'json',
                    bbox: bbox + ',EPSG:3857',
                },
                dataType: 'json',
                context: this,
                success: function (response) {
                    this._layer.clearLayers();
                    this._layer.addData(response);


                }
            });
        },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
        
            options.style = options.style || {normal:{}, highlight:{}};
            this._style = options.style; 
            this._style = options.style || {normal:{}, highlight:{}}; 
            this._style.normal = options.style.normal || this._style.normal; 
            this._style.highlight = options.style.highlight || this._style.highlight; 


            function highlightFeature(e) {
                   var layer = e.target;
                   var highlightStyle = auto._style.highlight; 

                    console.log('layer!!!!'); 
                    console.log(layer);
                    
                    if (PublicaMundi.isFunction(highlightStyle)){
                        highlightStyle = highlightStyle(layer.feature);
                    }

                   layer.setStyle(highlightStyle);

                   if (!L.Browser.ie && !L.Browser.opera) {
                        //layer.bringToFront();
                   }
                }
            var auto = this;
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                onClick = function (e) {
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
               

                    if (map._highlight){
                        if (map._highlight !== e.target){
                            
                            map._lastClicked.resetStyle(map._highlight);
                            
                            map._lastClicked = auto._layer;
                            map._highlight = e.target;
                            
                            highlightFeature(e);
                        }
                        else{
                        }
                    }
                    else{
                        if (map._lastClicked){
                        map._lastClicked.resetStyle(map._highlight);
                        }
                        map._lastClicked = auto._layer;
                        map._highlight = e.target;
                        highlightFeature(e);
                    } 

                };
            }
            this._layer = L.geoJson(null, {
                style: this._style.normal,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.4,
                        color: "#3399CC",
                        weight: 1.25,
                        opacity: 1
                    });
                }, 
                onEachFeature: function onEachFeature(feature, layer) {
                    if (PublicaMundi.isFunction(onClick)) {
                        layer.on({
                            click: onClick
                        });
                    //if (feature.properties.name){
                    //    layer.bindPopup(feature.properties.name);    
                   // }
                    //else {
                    //    layer.bindPopup(JSON.stringify(feature));
                    //}
                    }

                }
            }); 
            
        }

    });

    
        PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WFS,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.WFS',
        factory: PublicaMundi.Leaflet.Layer.WFS
    });
})(window, window.PublicaMundi, L);
