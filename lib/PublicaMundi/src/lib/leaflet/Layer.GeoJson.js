// <reference path="../../../jQuery/jquery-2.1.0.intellisense.js" />
/// <reference path="../../../Leaflet/leaflet-src.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, L, $) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }
    

    PublicaMundi.define('PublicaMundi.Leaflet.Layer');
    var popup;
    var ajax;
    PublicaMundi.Leaflet.Layer.GeoJson = PublicaMundi.Class(PublicaMundi.Layer, {
        _addToControl: function() { 
            if (this._map.getLayerControl()){
                this._map.getLayerControl().addOverlay(this._layer, this._options.title);
                }
            },
        onLayerLoad: function(cb) {
            console.log('ajax');
            console.log(ajax);
            //if (ajax !== undefined){
           //     cb.call();
            //}
            //$.ajax.on('ajaxSuccess', cb);
            //$(document).once('ajaxSuccess',cb);
            //function() {
                
            //this._layer.once('layeradd', function(e) {
            //    cb.call();
            //});
        }, 
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            //var bounds = L.latLngBounds([]); 
            /*
             * $(document).one("layerLoaded", function(){
                var currextent = layer._layer.getBounds();
                layer._map._map.fitBounds(currextent);
            });
            */
             //this._layer.on('layeradd', function(e) {
                //var bounds = layer._layer.getBounds()
                //console.log(layer._layer.getBounds()); 
                //console.log('layer added');
                 //console.log(e);
                //console.log(layer);
                //console.log(bounds);
                //bounds.extend(e.layer.getBounds());
                //console.log(bounds);
                //var layerBounds = layer._layer.getBounds();
                //bounds.extend(layerBounds);
                //layer._map._map.fitBounds(layerBounds);
                //layer._map._map.fitBounds([
                //        [83.64513, 180],
                //            [-85.609038, -180]
                //            ]);
                //console.log('layer add all');
                //console.log(layer._layer.getBounds());
                //layer._map._map.fitBounds(bounds);
            //});

        },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            options.style = options.style || {normal:{}, highlight:{}};
            console.log(this._style);
            //this._style = options.style;
            this._style.normal = options.style.normal ||  this._style.normal; 
            console.log(this._style);
            this._style.highlight = options.style.highlight || this._style.highlight; 
           
            console.log('layer gjson'); 
            console.log(this._style);

            var auto = this;
            
            if (!PublicaMundi.isDefined(options.projection)) {
                // TODO : Resolve projection / reproject    
            }
            
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                onClick = function (e) {
                 
                    function highlightFeature(e) {
                        var layer = e.target;
                        var highlightStyle = auto._style.highlight; 

                        console.log('layer!!!!'); 
                        console.log(layer);
                        if (PublicaMundi.isFunction(highlightStyle)){
                            highlightStyle = highlightStyle(layer.feature);
                        }
                        console.log(highlightStyle); 
                        layer.setStyle(highlightStyle);
                            
                        //if (!L.Browser.ie && !L.Browser.opera) {
                                //layer.bringToFront();
                        //}
                        }
   
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
             
                    if (map._highlight){
                        if (map._highlight !== e.target){
                            
                            map._lastClicked.resetStyle(map._highlight);
                            
                            map._lastClicked = auto._layer;
                            map._highlight = e.target;
                            //highlightStyle(e.target);
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
                        //highlightStyle(e.target);
                    }               

                };
                }
            
            this._layer = L.geoJson(null, {
                //style: options.style.normal,
                style: this._style.normal,
                //style: function(feature) {
                //        switch (feature.properties.name) {
                //            case 'Zimbabwe': return {color: "#ff0000", fillColor:"#ff0000"};
                //            case 'United States of America':   return {color: "#0000ff", fillColor: "#00ff00"};
        //} 
                //},
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, 
                        //options.style.highlight
                        {
                        radius: 5,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.4,
                        color: "#3399CC",
                        weight: 1.25,
                        opacity: 1
                    }
                        ); 
                    }, 
                 onEachFeature: function onEachFeature(feature, layer) {
                    if (PublicaMundi.isFunction(onClick)) {
                        layer.on({
                            click: onClick,
                            //mouseover: highlightFeature,
                            //mouseout: resetHighlight,
                        });
                    //layer.bindPopup(feature.properties.name);    
                    }
                },
                
            });

            ajax = $.ajax({       
                type: "GET",
                url: options.url,
                dataType: 'json',
                async: true, 
                context: this,
                beforeSend: function(){
                    console.log('loading...');
                },
                complete: function(){
                    console.log('finished loading.');
                },
                success: function (response) {
                    console.log('succeeded');
                    this._layer.addData(response);
                    //$.event.trigger({
                    //    type: "layerLoaded",
                    //});
                    // TODO: the following needs to be executed in fitToMap
                    // Leaflet fires layer add event for each feature in geojson
                    //var currextent = this._layer.getBounds();
                    //var southWest = currextent.getSouthWest();
                    //var northEast = currextent.getNorthEast();
                    //this._extent = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
                    
                },
                
                failure: function(response) {
                    console.log('failed');
                    console.log(response);
                }

            });
            
            
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.GeoJSON,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.GeoJson',
        factory: PublicaMundi.Leaflet.Layer.GeoJson
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.geoJSON = function (options) {
            switch (typeof options) {

            }
            options.type = options.type || PublicaMundi.LayerType.GeoJSON;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, L, jQuery);
