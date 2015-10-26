(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.OpenLayers.Helpers');

    PublicaMundi.OpenLayers.Helpers = PublicaMundi.Class(PublicaMundi.Helpers, {
        initialize: function () {
        },
        _getDefaultStyle: function(style, defaultStyle){
                if (!style && !defaultStyle){
                   return {};
                }
                /*if (PublicaMundi.isFunction(style)){ 
                    return style;
                    //return {};
                    //return jQuery.extend({}, style);
                }
                if (PublicaMundi.isFunction(defaultStyle)){
                    return defaultStyle;
                    //return {};
                    //return jQuery.extend({}, defaultStyle);
                }
                */
                var tstyle = {};

                tstyle.color = (style.color || defaultStyle.color) || 'rgba(0,255,0)';
                tstyle.opacity = style.opacity || defaultStyle.opacity || 1;
                tstyle.fillColor = style.fillColor || defaultStyle.fillColor || 'rgba(255,255,0)';
                tstyle.fillOpacity = style.fillOpacity || defaultStyle.fillOpacity || 1;
                tstyle.weight = style.weight || defaultStyle.weight || 1;
                tstyle.radius = style.radius || defaultStyle.radius || 6;
                
                return tstyle;
           },
        _transformStyle: function(style){
                if (!style){
                   return {};
                } 
                /*
                if (PublicaMundi.isFunction(style)){ 
                    return {};
                    //return jQuery.extend({}, style);
                }
                */
                var tstyle = {};
                //tstyle.color = style ? this._hexToRgba(style.color, style.opacity) : 'rgba(0,255,0,1)';
                //tstyle.fillColor = style ? this._hexToRgba(style.fillColor, style.fillOpacity) : 'rgba(0,255,0,1)';
                //tstyle.weight = style ? style.weight : 1;
                //tstyle.radius = style ? style.radius : 6;
                tstyle.color = this._hexToRgba(style.color, style.opacity);
                tstyle.fillColor = this._hexToRgba(style.fillColor, style.fillOpacity);
                tstyle.weight = style.weight;
                tstyle.radius = style.radius;

                return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: tstyle.color,
                            width: tstyle.weight,
                        }),
                        fill: new ol.style.Fill({
                            color: tstyle.fillColor,
                            }),
                        image: new ol.style.Circle({
                            radius: tstyle.radius,
                            stroke: new ol.style.Stroke({
                                color: tstyle.color,
                                width: tstyle.weight,
                            }),
                            fill: new ol.style.Fill({
                                color: tstyle.fillColor,
                                }),
                            })
                    });

        },
        _hexToRgba: function(color, opacity){
            var tcolor = color;
            var topacity = opacity; 
            if (color){
                if (color.indexOf('#') === 0){
                        tcolor = ol.color.asArray(tcolor);
                        tcolor = tcolor.slice();
                        tcolor[3] = opacity;  // change the alpha of the color 
                        tcolor = ol.color.asString(tcolor);
                    }
            }
            return tcolor;
        },
    });

    PublicaMundi.locator.register('PublicaMundi.Helpers', PublicaMundi.OpenLayers.Helpers);

    PublicaMundi.helpers = function () {
        return PublicaMundi.locator.create('PublicaMundi.Helpers');
    };
})(window, PublicaMundi);
