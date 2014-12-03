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
            //this._layer.once('layeradd', function(){
                this._map.setExtent(layer._extent, 'EPSG:4326');
            //});
        },
        update: function() { 
            var bbox = this._map._getViewBox();
            $.ajax({
                type: "GET",
                url: this._options.url + '?service=WFS&request=GetFeature&typename=' + this._options.params.layers + '&srsname=EPSG:4326' + '&outputFormat=json' +'&bbox=' + bbox + ',EPSG:3857',
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
            
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                onClick = function (e) {
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
                };
            }
            this._layer = L.geoJson(null, {
                style: {
                    color: '#3399CC',
                    weight: 1.25,
                    opacity: 1,
                    fillColor: '#FFFFFF',
                    fillOpacity: 0.4
                }, 
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
