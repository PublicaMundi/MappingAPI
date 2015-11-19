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
                if (this._options.switcher == 'base'){
                    this._map.getLayerControl().addBaseLayer(this._layer, this._options.title);
                }
                else{
                    this._map.getLayerControl().addOverlay(this._layer, this._options.title);
                }
            }
        },
        // TODO: not yet supported
        onLayerLoad: function() {
        }, 
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            
        },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            options.style = options.style || {normal:{}, highlight:{}};
            this._style.normal = options.style.normal ||  this._style.normal; 
            this._style.highlight = options.style.highlight || this._style.highlight; 

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

                        if (PublicaMundi.isFunction(highlightStyle)){
                            highlightStyle = highlightStyle(layer.feature);
                        }
                        layer.setStyle(highlightStyle);
                            
                        }
   
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
             
                    if (this._highlight){
                        if (this._highlight !== e.target){
                            
                            this._lastClicked.resetStyle(map._highlight);
                            
                            this._lastClicked = auto._layer;
                            this._highlight = e.target;
                            highlightFeature(e);
                        }
                        else{
                        }
                    }
                    else{
                        if (this._lastClicked){
                        this._lastClicked.resetStyle(this._highlight);
                        }
                        this._lastClicked = auto._layer;
                        this._highlight = e.target;
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
                },
                complete: function(){
                },
                success: function (response) {
                    this._layer.addData(response);
                                        
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
