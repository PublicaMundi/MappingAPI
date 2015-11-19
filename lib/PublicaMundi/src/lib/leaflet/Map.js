(function (window, PublicaMundi, L) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.Leaflet');

    _project = function(x) {
                var center = L.CRS.EPSG3857.projection.project(x).multiplyBy(6378137);
                return center;
            };

    _unproject = function (location) {
                var projected = L.point(location[0], location[1]).divideBy(6378137);
                return L.CRS.EPSG3857.projection.unproject(projected);
            };

    PublicaMundi.Leaflet.Map = PublicaMundi.Class(PublicaMundi.Map, {
        // Attempt to unify info overlays
        addOverlay: function(element) {
            var popup = new L.popup({className:'hideparent', closeButton:false}).setLatLng(this._map.getCenter());
            popup.setContent(element);
            //this._map.addLayer(popup);
            popup.addTo(this._map);
            this._popup = popup;
            return popup;
        },
        getOverlayElement: function(popup){
            return popup.getContent();
        },
        setOverlayPosition: function(popup, pixel){
            var npx = [ pixel[0]/(6378137), pixel[1]/(6378137) ];
            popup.setLatLng(npx);
            //popup.setPosition(pixel);
        },
        initialize: function (options) {
            PublicaMundi.Map.prototype.initialize.call(this, options);

            var map = this;
            this._lastClicked = null;
            if ((PublicaMundi.isClass('L.Map')) && (options instanceof L.Map)) {
                this._map = options;
            } else {
                // TODO : Resolve projection
                this._map = L.map(options.target, {
                    // TODO : Add projection
                    projection: options.projection,
                    center: _unproject(options.center),
                    zoom: options.zoom,
                    maxZoom: options.maxZoom,
                    minZoom: options.minZoom,
                    attributionControl: false,
                    closePopupOnClick: false

                });
            }
            if (options.layerControl){
                this.setLayerControl();
            }
            this._listen();
            var map = this;
            function onMapClick(e) {
                    if (map._highlight && map._lastClicked){

                        map._lastClicked.resetStyle(map._highlight);
                        map._highlight = null;
                        map._lastClicked = null;
                    }
            }

            this._map.on('click', onMapClick);

            if ((typeof options.layers !== 'undefined') && (PublicaMundi.isArray(options.layers))) {
                for (var index = 0; index < options.layers.length; index++) {
                    this.createLayer(options.layers[index]);

                }
            }
        },
        setCenter: function (x, y) {
            if (PublicaMundi.isArray(x)) {
                this._map.setView(_unproject(x), this._map.getZoom());
            } else {
                this._map.setView(_unproject([x, y]), this._map.getZoom());
            }
        },
        getCenter: function () {
            var center = this._map.getCenter();
            center = L.CRS.EPSG3857.projection.project(center).multiplyBy(6378137);
            return [center.x, center.y];
        },
        setZoom: function (z) {
            this._map.setView(this._map.getCenter(), z);
        },
        getZoom: function () {
            return this._map.getZoom();
        },
        getProjection: function () {
            return 'EPSG:3857';
        },
        getTarget: function () {
            return this._map.getTarget();
        },
        addLayer: function (layer) {
            
            if (layer.getOptions().fitToMap){
                layer.fitToMap();
            }

            if (layer._options.visible !== false){
                this._map.addLayer(layer.getLayer());
            }
            layer.update();
            layer._addToControl();
        },
        removeLayer: function (layer) {
            if(layer) {
                this._map.removeLayer(layer.getLayer());
                for(var i=0; i < this._layers.length; i++) {
                    if (this._layers[i] == layer) {
                        this._layers.splice(i,1);
                        break;
                    }
                }

            }
        },
        setExtent: function (extent, proj){
            if (extent === null) {
                return;
            }
            var transformation;
            if (proj == 'EPSG:4326') {
                    transformation = extent;
            }
            else if (proj == 'EPSG:3857'){
                transformation = _unproject(extent);
            }
            else {
                transformation = null;
            }

            var southWest =  new L.LatLng(transformation[1], transformation[0]);
            var northEast = new L.LatLng(transformation[3], transformation[2]);
            this._map.fitBounds(new L.LatLngBounds(southWest,northEast));
        },
        _listen: function() {
            var map = this;
            var idx = 0;

            this._map.on('moveend', function() {
                map._setViewBox();
                var layers = map.getLayers();
                //update each layer on mouse pan or zoom
                $.each(layers, function(idx, layer) {
                    layer.update();
                });

            });

        },

        _setViewBox: function() {
                var southWest = _project(this._map.getBounds().getSouthWest());
                var northEast = _project(this._map.getBounds().getNorthEast());
                this._viewbox = southWest.x+','+southWest.y+','+northEast.x+','+northEast.y;

        },
        setLayerControl: function(base) {
            if (!this._control){
                this._control = new L.control.layers();
                this._control.addTo(this._map);
            }
            return this._control;
        },

    });

    PublicaMundi.locator.register('PublicaMundi.Map', PublicaMundi.Leaflet.Map);
})(window, window.PublicaMundi, L);
