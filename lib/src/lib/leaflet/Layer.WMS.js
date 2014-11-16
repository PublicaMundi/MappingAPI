(function (global, PublicaMundi, L) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.Leaflet.Layer');

    PublicaMundi.Leaflet.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._layer = L.tileLayer.wms(options.url, {
                layers: options.params.LAYERS,
                format: 'image/png',
                transparent: true
            });
        }
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WMS,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.WMS',
        factory: PublicaMundi.Leaflet.Layer.WMS
    });
})(window, window.PublicaMundi, L);