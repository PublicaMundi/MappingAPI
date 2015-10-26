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
    PublicaMundi.OpenLayers.Layer.GeoJson = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            
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
                
                //this._style.normal = options.style.normal;
                //if (!PublicaMundi.isFunction(options.style.normal)){
                //this._style.highlight = helpers._getDefaultStyle(options.style.highlight, this._style.highlight);
                //}

                //var style = helpers._transformStyle;
                console.log('style');
                console.log(style);
            this._layer = new ol.layer.Vector({
                title: options.title,
                visible: options.visible,
                source: new ol.source.GeoJSON({
                //source: new ol.source.Vector({
                    projection: options.projection,
                    url: options.url
                }),
                style: style,
                //style: this._transformStyle,
                    //function(feat, res){ return helpers._transformStyle(feat, res, style)}
            });
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
        layer: PublicaMundi.LayerType.GeoJSON,
        framework: PublicaMundi.OpenLayers.Framework,
        type: 'PublicaMundi.Layer.GeoJson',
        factory: PublicaMundi.OpenLayers.Layer.GeoJson
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.geoJSON = function (options) {
            options.type = options.type || PublicaMundi.LayerType.GeoJSON;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, ol);
