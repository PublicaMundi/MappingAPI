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

    PublicaMundi.define('PublicaMundi.OpenLayers.Layer');

    PublicaMundi.OpenLayers.Layer.WFS = PublicaMundi.Class(PublicaMundi.Layer, {
        update: function() {
                    },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            this._map = null;
            this._type = null;
 
            options.style = options.style || {normal:{}, highlight:{}}; 
            options.style.normal = options.style.normal || {}; 
            options.style.highlight = options.style.highlight || {}; 

            var style = this._style.normal;
            var helpers = PublicaMundi.helpers();

            if (PublicaMundi.isFunction(options.style.normal)){
                this._style.normal = options.style.normal;
                style = this._style.normal;
            }
            else{
                this._style.normal = helpers._getDefaultStyle(options.style.normal, this._style.normal);
                style = helpers._transformStyle(this._style.normal);
            }
            if (PublicaMundi.isFunction(options.style.highlight)){
                this._style.highlight = options.style.highlight;
            }
            else{
                this._style.highlight = helpers._getDefaultStyle(options.style.highlight, this._style.normal);
            }
            var version = options.params.version;
            var maxFeatures = options.params.maxFeatures;
            
            // Set JSON as preferable transfer format
            var output_format = options.params.format || 'json';
            var format; 

            // Set v2 as default version for GML
            if (output_format =='gml'){
                output_format = 'gml2';
            }
            
            if (output_format == 'json') {
                format = new ol.format.GeoJSON();
            }
            else if (output_format == 'gml32' || output_format == 'gml31' || output_format == 'gml3'){
                format = new ol.format.WFS({
                             //   featureNS: undefined,
                             //  featureType:  undefined, //'og:archsites',
                            gmlFormat: new ol.format.GML3(),
                            extractAttributes: true,
                            resFactor: 1,
                        });
            }
            else if (output_format == 'gml2'){
                format = new ol.format.WFS({
                             //   featureNS: undefined,
                             //  featureType:  undefined,
                            gmlFormat: new ol.format.GML2(),
                            //extractAttributes: true
                        });
            }

            //var version = options.version || '1.0.0';
           var projection = options.params.projection || 'EPSG:3857'; 

            if (projection == 'EPSG:900913'){
                projection = 'EPSG:3857';
            }
            else if ( projection == 'EPSG:26713'){
                    projection = 'EPSG:3857';
                }
            
            var name = options.params.layers;
                //var vectorSource = new ol.source.Vector({
                /*
                var vectorSource = new ol.source.ServerVector({
                format: format,
                projection: projection,
                //dataType: 'jsonp',
                 //var vectorSource = new ol.source.Vector({
                 */
                 var vectorSource = new ol.source.Vector({
                    format: format,
                    projection: projection,
                    //dataType: 'jsonp',
                     //strategy: ol.loadingstrategy.bbox,
                    //strategy: ol.loadingstrategy.tile(new ol.tilegrid.createXYZ({
                    strategy: ol.loadingstrategy.tile(new ol.tilegrid.XYZ({
                        //maxZoom: 19,
                        //minZoom: 8
                    })),
                    //strategy: ol.loadingstrategy.bbox,
                //strategy: ol.loadingstrategy.tile(new ol.tilegrid.createXYZ({
                //strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
                    //maxZoom: 19,
                    //minZoom: 8
                //})),
                //strategy: ol.loadingstrategy.bbox,
                loader: function(extent, resolution, proj) {
                    var params = {
                            service: 'WFS',
                            request: 'GetFeature',
                            typename: name,
                            srsname: projection,
                            outputFormat: output_format,
                            bbox: extent.join(',')+ ',EPSG:3857',
                            version: version,
                        };
                    var maxFeaturesParam = 'maxFeatures';
                    if (version === '2.0.0'){
                        maxFeaturesParam = 'count';
                    }
                    params[maxFeaturesParam] = maxFeatures;

                    $.ajax({
                        type: "GET",
                        url: options.url,
                        data: params,                  
                        async: true, 
                        //dataType: 'jsonp',
                        beforeSend: function(){
                            //$('.loading-spinner').css({'display':'block'});
                        },
                        complete: function(){
                            //$('.loading-spinner').css({'display':'none'});
                        },
                        success: function(response) {
                            loadFeatures(response);
                            $.event.trigger({
                                type: "layerLoaded",
                            });

                        },
                        failure: function(response) {
                            console.log('response');
                            console.log(response);
                        }
                    } );
                    },
            });

            var loadFeatures = function(response) {
                var proj = { dataProjection: projection, featureProjection: 'EPSG:3857'};
                vectorSource.addFeatures(format.readFeatures(response));
                
            };

            this._layer = new ol.layer.Vector({
                title: options.title,
                type: options.switcher, 
                source: vectorSource, 
                visible: options.visible,
                projection: projection,
                style: style,
            });
        
        },
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            // if bbox option is provided use it for the layer extent
            if (layer._extent !== null){
                layer._layer.once('postcompose', function() {
                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                });
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
                                    layer._layer.once('postcompose', function() {
                                            layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                        });
                                    return false;
                                }
                            }
                        }
                    });
            }
        },
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WFS,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.WFS',
        factory: PublicaMundi.OpenLayers.Layer.WFS
    });
})(window, window.PublicaMundi, ol);

