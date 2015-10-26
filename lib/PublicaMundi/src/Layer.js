(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Layer = PublicaMundi.Class({
        initialize: function (options) {

            this._map = null;
            this._type = null;
            this._layer = null;
            this._style = {
                    normal:{
                        color: '#3399CC',
                        radius: 6,
                        weight: 1.25,
                        opacity: 1,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.4
                    },
                    highlight:{}
                  
            };
            this._extent = options.bbox || null;
            this._options = options || {};
        },
        setMap: function(map) {
            this._map = map;
        },
        getMap: function() {
            return this._map;
        },
        getType: function() {
            return this._type;
        },
        getLayer: function () {
            return this._layer;
        },
        getStyle: function () {
            return this._style;
        },
        fitToMap: function() {
            return this._extent;
        },
        onLayerLoad: function() {
            return this._layer;
        },
        getOptions: function () {
            return this._options;
        },
        addToControl: function() { 
            return null;
        },
        update: function() {
            return null;
        },
        _transformStyle: function() {
            return null;
        },

    });

    PublicaMundi.locator.register('PublicaMundi.Layer', PublicaMundi.Layer);
})(window, PublicaMundi);
