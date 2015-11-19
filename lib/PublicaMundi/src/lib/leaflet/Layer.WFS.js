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
        fitToMap2: function() {
            var layer = this;

             var options = this._options;

            this._layer.once('layeradd', function(){
                this._map.setExtent(layer._extent, 'EPSG:4326');
            });
        },
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            console.log('fitting wfs');
            // if bbox option is provided use it for the layer extent
            if (layer._extent !== null){
                //layer._layer.once('layeradd', function() {
                //layer._layer.once('', function(e) {
                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                //});
            }
            // otherwise ask the server for the layer bbox
            else{
                var parser = PublicaMundi.parser();
                var url  = options.url + '?service=WFS&request=GetCapabilities';
                console.log('getting capas');
                $.ajax({
                    url: url,
                    success: function(response) {
                        var result = parser.parseWFS(response);
                        var layers = result.Layer;
                        
                        for (var idx in layers){
                                var candidate = layers[idx];
                                if (candidate.Name == options.params.layers){
                                    console.log('found');
                                    layer._extent = candidate.WGS84BoundingBox;
                                    //layer._layer.once('layeradd', function() {
                                    layer._layer.once('load', function(e) {
                                            layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                        });
                                    return false;
                                }
                            }
                        }
                    });
            }
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

                    if (PublicaMundi.isFunction(highlightStyle)){
                        highlightStyle = highlightStyle(layer.feature);
                    }

                   layer.setStyle(highlightStyle);

                }
            var auto = this;
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
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
                            click: onClick
                        });
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

