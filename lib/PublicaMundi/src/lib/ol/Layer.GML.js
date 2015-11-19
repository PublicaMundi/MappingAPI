/// <reference path="../../OpenLayers/build/ol-whitespace.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, ol) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof ol === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.GML = PublicaMundi.Class(PublicaMundi.Layer, {
        
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

           
            var projection = options.projection ? options.projection : 'EPSG:3857'; 

            if (projection == 'EPSG:900913'){
                projection = 'EPSG:3857';
            }
            else if ( projection == 'EPSG:26713'){
                    projection = 'EPSG:3857';
                }
            
            var format = new ol.format.WFS({
                                    //featureNS: 'ogr',
                                    //featureType: 'poi_thessalonikis',
                                    //featureNS: (options.featureNS ? layer.featureNS : undefined),
                                    //featureType: (options.featureType ? layer.featureType : undefined),
                                    gmlFormat: new ol.format.GML3(),
                                    extractAttributes: 'False',
                                    //geometryName: 'geometryProperty'
            });

            var vectorSource = new ol.source.ServerVector({
            //var vectorSource = new ol.source.StaticVector({
                    //format: new ol.format.GeoJSON(),
                    format: format,
                    projection: projection,
                    //url: options.url,
                    //projection: 'EPSG:3857',
                     //url: options.url,
                    //strategy: ol.loadingstrategy.bbox,
                   // strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({

                loader: function(extent, resolution, proj) {
                    $.ajax({
                        type: "GET",
                        url: options.url,
                        //url: options.url+  '?service=WFS&request=GetFeature&typename='+options.name+'&srsname=EPSG:4326&outputFormat=json' +
                        //url: options.url+  '?service=WFS&request=GetFeature&typename='+options.name+ '&srsname='+projection + '&outputFormat='+ output_format +  '&bbox=' + extent.join(',')+ ',EPSG:3857' + '&maxFeatures=' + options.maxFeatures + '&version=1.1.0',
                        //'&maxFeatures=' + options.maxFeatures + '&version=' + version 
                        //'&format_options=callback:loadFeatures',
                        //dataType: 'jsonp',
                        //dataType: 'json',
                        //outputFormat: 'json',
                        //dataType: 'xml',
                        success: function(response) {
                            loadFeatures(response);
                        },
                        failure: function(response) {
                            //console.log('FAILURE');
                            //console.log(response);
                        }
                    } );

                     }, 
                    });
            console.log('vectorSource');
            console.log(vectorSource);
            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                source: vectorSource, 
                //visible: options.visible,
                visible: true,
                projection: projection,
                });

            var loadFeatures = function(response) {
                //var proj = { dataProjection: 'EPSG:900913', featureProjection: 'EPSG:900913'};
                var proj = { dataProjection: 'EPSG:2100', featureProjection: 'EPSG:2100'};
                //var proj = {};
                //console.log(vectorSource.readFeatures(response,  proj));
                //console.log(vectorSource.readFeatures(response));
                //vectorSource.addFeatures(vectorSource.readFeatures(response));
                vectorSource.addFeatures(vectorSource.readFeatures(response));
                };


        },
        fitToMap: function() {
            var layer = this;
            this._layer.once('postcompose', function() {
                layer._extent = this.getSource().getExtent();
                layer.getMap().setExtent(layer._extent, 'EPSG:3857');
            });
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.GML,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.GML',
        factory: PublicaMundi.OpenLayers.Layer.GML
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.GML = function (options) {
            options.type = PublicaMundi.LayerType.GML;

            return this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, ol);
