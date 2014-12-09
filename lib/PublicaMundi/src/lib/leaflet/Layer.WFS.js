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
        
        // fitToMap: function() {
       //     var layer = this;
            //this._layer.once('layeradd', function(){
            //    this._map.setExtent(layer._extent, 'EPSG:4326');
            //});
       // },
        fitToMap: function() {
        
            var layer = this;
            var options = this._options;

            if (typeof options.bbox === "undefined"){                    
                    console.log('Getting Capabilities...');
                    
                    $.ajax(options.url+"?service=WFS&request=GetCapabilities").then(function(response) {
                            
                        response = xmlToJson(response);
                        var candidates = response['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType;
                        $.each(candidates, function(idx, candidate) {
                            if (candidate.Name){
                            if (candidate.Name["#text"]){
                            if (candidate.Name["#text"] == options.params.layers){
                                    var bbox = candidate.WGS84BoundingBox;
                                    var lc = null;
                                    var uc = null;
                                    if (typeof bbox === "undefined") {
                                        bbox = candidate["ows:WGS84BoundingBox"];
                                        lc = bbox['ows:LowerCorner']["#text"];
                                        uc = bbox['ows:UpperCorner']["#text"];
                                    }
                                    else {
                                        lc = bbox.LowerCorner["#text"];
                                        uc = bbox.UpperCorner["#text"];
                                    }
                                    
                                    if (typeof bbox !== "undefined") {
                                        lc = lc.split(' ');
                                        uc = uc.split(' ');
                                        bboxfloat = [ parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]) ];
                                    }
                                    layer._extent = bboxfloat;
                                    layer._layer.once('layeradd', function() {
                                            layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    });

                                    return false;
                                    }}}
                   });
                   });
            }
            else{

            console.log('Bbox option found');
            layer._layer._map.once('layeradd', function() {
                layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            });

            //this._layer.once('postcompose', function() {
            //    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
            //});
            }

        },



        update: function() { 
            //Set initial viewbox
            if (this._map._getViewBox()=='0,0,0,0'){
                this._map._setViewBox();
                }
            var bbox = this._map._getViewBox();
            $.ajax({
                type: "GET",
                url: this._options.url + '?service=WFS&request=GetFeature&typename=' + this._options.params.layers + '&srsname=EPSG:4326' + '&outputFormat=json' +'&bbox=' + bbox + ',EPSG:3857',
                dataType: 'json',
                context: this,
                success: function (response) {
                    console.log('success');
                    this._layer.clearLayers();
                    this._layer.addData(response);


                },
                failure: function(response){
                    console.log('failure');
                    }

            });
        },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            
            function highlightFeature(e) {
                   var layer = e.target;

                   layer.setStyle({
                        opacity: 1,
                        weight: 3,
                        color: '#3399CC',
                   });
                   if (!L.Browser.ie && !L.Browser.opera) {
                        layer.bringToFront();
                   }
                }
            var auto = this;
            function resetHighlight(e) {
                auto._layer.resetStyle(auto._map._highlight);
            }


            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                onClick = function (e) {
                    options.click(auto, [e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
                
                if (map._highlight){
                    if (map._highlight !== e.target){
                        resetHighlight(e);
                        map._highlight = e.target;
                        highlightFeature(e);
                    }
                    else{
                    }
                }
                else{
                    map._highlight = e.target;
                    highlightFeature(e);
                }
                
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

                },
                //filter: function(feature, layer) {
                    
                //    return options.visible;
                //    }

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
