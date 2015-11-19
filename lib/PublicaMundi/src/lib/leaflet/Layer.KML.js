/// <reference path="../../../jQuery/jquery-2.1.0.intellisense.js" />
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

    PublicaMundi.Leaflet.Layer.KML = PublicaMundi.Class(PublicaMundi.Layer, {
        //TODO: not yet supported
        fitToMap: function() {
            var layer = this;

        },
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
 
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            options.style = options.style || {normal:{}, highlight:{}};
            this._style = options.style;
            this._style.normal = options.style.normal || this._style.normal;
            this._style.highlight = options.style.highlight || this._style.highlight;

            if (!PublicaMundi.isDefined(options.projection)) {
                // TODO : Resolve projection / reproject
            }


            var auto = this;
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                var highlightStyle = this._style.highlight;
                function highlightFeature(e) {
                   var layer = e.target;
                   var highlightStyle = auto._style.highlight;

                    if (PublicaMundi.isFunction(highlightStyle)){
                        highlightStyle = highlightStyle(layer.feature);
                    }

                   layer.setStyle(highlightStyle);
                }
                
                onClick = function (e) {
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
                            click: onClick,

                        });
                        //layer.bindPopup(feature.properties.name);
                    }
                },

            });

            $.ajax({
                type: "GET",
                url: options.url,
                dataType: 'xml',
                async: true,
                context: this,
                beforeSend: function(){
                },
                complete: function(){
                },
                success: function (response) {
                    // Converting KML to geojson and handling as json
                    var test = toGeoJSON.kml(response);
                    this._layer.addData(test);

                    $.event.trigger({
                        type: "layerLoaded",
                    });

                    // TODO: same as GeoJson

                    var currextent = this._layer.getBounds();
                    var southWest = currextent.getSouthWest();
                    var northEast = currextent.getNorthEast();
                    this._extent = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];

                    //this._map.setExtent(this._extent, 'EPSG:4326');


                },
                failure: function(response) {
                    console.log('failed');
                    console.log(response);
                }

            });
        }
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.KML,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.KML',
        factory: PublicaMundi.Leaflet.Layer.KML
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.KML = function (options) {
            options.type = PublicaMundi.LayerType.KML;

            return this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, L, jQuery);

