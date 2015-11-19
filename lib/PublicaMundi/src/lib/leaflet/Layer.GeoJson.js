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

                options.projection = 'EPSG:3857'
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

                    var map = auto.getMap();

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
                        //highlightStyle(e.target);
                    }
                };
                }

            this._layer = L.Proj.geoJson(null, {

                style: this._style.normal,

                pointToLayer: function (feature, latlng) {

                    return L.circleMarker(latlng,{
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
                            click: onClick,
                            //mouseover: highlightFeature,
                            //mouseout: resetHighlight,
                        });

                    //layer.bindPopup(feature.properties.name);
                    }
                },

            });

            if((options.text) && (!options.data)) {

                options.data = JSON.parse(options.text);
            }

            if((options.data) && (options.data.type == 'Feature')) {

                options.data = {
                    type: 'FeatureCollection',
                    features: [options.data]
                };
            }

            if(typeof options.data.crs == 'undefined') {

                options.data.crs = {
                    type: 'name',
                    properties: {
                        name: 'urn:ogc:def:crs:EPSG::' + (options.projection.split(':')[1])
                    }
                };
            }

            if(options.url) {
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
                    }
                });

            } else if (options.data) {

                this._layer.addData(options.data);
            }
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
            options.type = PublicaMundi.LayerType.GeoJSON;

            return this.createLayer(options);
        };
    }

})(window, window.PublicaMundi, L, jQuery);

