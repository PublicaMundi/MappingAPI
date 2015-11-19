/* PublicaMundi Mapping API version 0.1.0 2015-11-12 */
(function (window, PublicaMundi) {
	"use strict";

	if (typeof PublicaMundi === 'undefined') {
		return;
	}

	PublicaMundi.define('PublicaMundi.Leaflet');

	PublicaMundi.Leaflet.Framework = 'leaflet';

	PublicaMundi.registerFrameworkResolver(PublicaMundi.Leaflet.Framework, function () {
	    if ((PublicaMundi.isObject(L)) && (PublicaMundi.isFunction(L.Map))) {
	        return true;
	    }
	    return false;
	});

})(window, PublicaMundi);;toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) {
        if (x) { norm(x); }
        return (x && x.firstChild && x.firstChild.nodeValue) || '';
    }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) {
        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
            ele = get1(x, 'ele');
        if (ele) ll.push(parseFloat(nodeVal(ele)));
        return ll;
    }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    // only require xmldom in a node environment
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new (require('xmldom').XMLSerializer)();
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc) {

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function kmlColor(v) {
                var color, opacity;
                v = v || "";
                if (v.substr(0, 1) === "#") v = v.substr(1);
                if (v.length === 6 || v.length === 3) color = v;
                if (v.length === 8) {
                    opacity = parseInt(v.substr(0, 2), 16) / 255;
                    color = v.substr(2);
                }
                return [color, isNaN(opacity) ? undefined : opacity];
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                if (elems.length === 0) elems = get(root, 'gx:coord');
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                if (get1(root, 'gx:MultiTrack')) return getGeometry(get1(root, 'gx:MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track' ||
                                geotypes[i] == 'gx:Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    timeSpan = get1(root, 'TimeSpan'),
                    extendedData = get1(root, 'ExtendedData'),
                    lineStyle = get1(root, 'LineStyle'),
                    polyStyle = get1(root, 'PolyStyle');

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (timeSpan) {
                    var begin = nodeVal(get1(timeSpan, 'begin'));
                    var end = nodeVal(get1(timeSpan, 'end'));
                    properties.timespan = { begin: begin, end: end };
                }
                if (lineStyle) {
                    var linestyles = kmlColor(nodeVal(get1(lineStyle, 'color'))),
                        color = linestyles[0],
                        opacity = linestyles[1],
                        width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                    if (color) properties.stroke = color;
                    if (!isNaN(opacity)) properties['stroke-opacity'] = opacity;
                    if (!isNaN(width)) properties['stroke-width'] = width;
                }
                if (polyStyle) {
                    var polystyles = kmlColor(nodeVal(get1(polyStyle, 'color'))),
                        pcolor = polystyles[0],
                        popacity = polystyles[1],
                        fill = nodeVal(get1(polyStyle, 'fill')),
                        outline = nodeVal(get1(polyStyle, 'outline'));
                    if (pcolor) properties.fill = pcolor;
                    if (!isNaN(popacity)) properties['fill-opacity'] = popacity;
                    if (fill) properties['fill-opacity'] = fill === "1" ? 1 : 0;
                    if (outline) properties['stroke-opacity'] = outline === "1" ? 1 : 0;
                }
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc(),
                feature;
            for (i = 0; i < tracks.length; i++) {
                feature = getTrack(tracks[i]);
                if (feature) gj.features.push(feature);
            }
            for (i = 0; i < routes.length; i++) {
                feature = getRoute(routes[i]);
                if (feature) gj.features.push(feature);
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getPoints(node, pointname) {
                var pts = get(node, pointname), line = [],
                    l = pts.length;
                if (l < 2) return;  // Invalid line in GeoJSON
                for (var i = 0; i < l; i++) {
                    line.push(coordPair(pts[i]));
                }
                return line;
            }
            function getTrack(node) {
                var segments = get(node, 'trkseg'), track = [], line;
                for (var i = 0; i < segments.length; i++) {
                    line = getPoints(segments[i], 'trkpt');
                    if (line) track.push(line);
                }
                if (track.length === 0) return;
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: track.length === 1 ? 'LineString' : 'MultiLineString',
                        coordinates: track.length === 1 ? track[0] : track
                    }
                };
            }
            function getRoute(node) {
                var line = getPoints(node, 'rtept');
                if (!line) return;
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;
;(function (window, PublicaMundi, L) {
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

            function onMapClick(e) {
                    if (this._highlight && this._lastClicked){
                        
                        this._lastClicked.resetStyle(this._highlight);
                        this._highlight = null;
                        this._lastClicked = null;
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
                layer.update();
            }
            layer._addToControl();
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
;/// <reference path="../../../Leaflet/leaflet-src.js" />

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

    PublicaMundi.Leaflet.Layer.WMS = PublicaMundi.Class(PublicaMundi.Layer, {
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
        onLayerLoad: function() {
        },        
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            var options = this._options;
            this._layer.once('load', function(e) {
                //if (typeof options.bbox !== "undefined"){                    
                if (layer._extent !== null){
                    layer.getMap().setExtent(options.bbox, 'EPSG:4326');
                }
                else{
                    var parser = PublicaMundi.parser();
                    var url  = options.url + '?service=WMS&request=GetCapabilities';
                    $.ajax({
                        url: url,
                        success: function(response) {
                            var result = parser.parseWMS(response);
                            var layers = result.Layer;
                            for (var idx in layers){
                                var candidate = layers[idx];
                                if (candidate.Name == options.params.layers){
                                    //layer._extent = candidate.WGS84BoundingBox;
                                    layer._extent = candidate.EX_GeographicBoundingBox;
                                    layer.getMap().setExtent(layer._extent, 'EPSG:4326');
                                    return false;
                                }
                            }
                        }
                    });
                }
            });
        },

        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
            this._layer = L.tileLayer.wms(options.url, {
                layers: options.params.layers,
                format: 'image/png',
                transparent: true
            });
        },
    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.WMS,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.WMS',
        factory: PublicaMundi.Leaflet.Layer.WMS
    });
})(window, window.PublicaMundi, L);
;/// <reference path="../../../Leaflet/leaflet-src.js" />
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
               

                    if (this._highlight){
                        if (this._highlight !== e.target){
                            
                            this._lastClicked.resetStyle(this._highlight);
                            
                            this._lastClicked = auto._layer;
                            this._highlight = e.target;
                            
                            highlightFeature(e);
                        }
                        else{
                        }
                    }
                    else{
                        if (this._lastClicked){
                        this._lastClicked.resetStyle(this._highlight);
                        }
                        this._lastClicked = auto._layer;
                        this._highlight = e.target;
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
;(function (global, PublicaMundi, L) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi.Leaflet.Layer');

    PublicaMundi.Leaflet.Layer.Tile = PublicaMundi.Class(PublicaMundi.Layer, {
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            this._layer = L.tileLayer(options.url);
        },
        _addToControl: function() { 
            if (this._map.getLayerControl()){
                if (this._options.switcher == 'base'){
                    this._map.getLayerControl().addBaseLayer(this._layer, this._options.title);
                }
                else{
                    this._map.getLayerControl().addOverlay(this._layer, this._options.title);
                }
            }
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.TILE,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.Tile',
        factory: PublicaMundi.Leaflet.Layer.Tile
    });
})(window, window.PublicaMundi, L);
;/// <reference path="../../../jQuery/jquery-2.1.0.intellisense.js" />
/// <reference path="../../../Leaflet/leaflet-src.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, L, $) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }
    
    PublicaMundi.define('PublicaMundi.Leaflet.Layer');

    PublicaMundi.Leaflet.Layer.KML = PublicaMundi.Class(PublicaMundi.Layer, {
        //TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            
        },
       _addToControl: function() { 

           if (this._map.getLayerControl()){
                if (this._options.switcher == 'base'){
                    this._map.getLayerControl().addBaseLayer(this._layer, this._options.title);
                }
                else{
                    this._map.getLayerControl().addOverlay(this._layer, this._options.title);
                }
            }
        },
 
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);
      
            options.style = options.style || {normal:{}, highlight:{}};
            this._style = options.style;
            this._style.normal = options.style.normal || this._style.normal; 
            this._style.highlight = options.style.highlight || this._style.highlight; 

            if (!PublicaMundi.isDefined(options.projection)) {
                // TODO : Resolve projection / reproject    
            }


            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                var highlightStyle = this._style.highlight;
                function highlightFeature(e) {
                   var layer = e.target;
                   var highlightStyle = auto._style.highlight; 

                    if (PublicaMundi.isFunction(highlightStyle)){
                        highlightStyle = highlightStyle(layer.feature);
                    }

                   layer.setStyle(highlightStyle);
                }
            var auto = this;
            
                onClick = function (e) {
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
              
                    if (this._highlight){
                        if (this._highlight !== e.target){
                            
                            this._lastClicked.resetStyle(this._highlight);
                            
                            this._lastClicked = auto._layer;
                            this._highlight = e.target;
                            
                            highlightFeature(e);
                        }
                        else{
                        }
                    }
                    else{
                        if (this._lastClicked){
                        this._lastClicked.resetStyle(this._highlight);
                        }
                        this._lastClicked = auto._layer;
                        this._highlight = e.target;
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
                            click: onClick,

                        });
                        //layer.bindPopup(feature.properties.name);    
                    }
                },
         
            });
            
            $.ajax({       
                type: "GET",
                url: options.url,
                dataType: 'xml',
                async: true, 
                context: this,
                beforeSend: function(){
                },
                complete: function(){
                },
                success: function (response) {
                    // Converting KML to geojson and handling as json
                    var test = toGeoJSON.kml(response);
                    this._layer.addData(test);

                    $.event.trigger({
                        type: "layerLoaded",
                    });

                    // TODO: same as GeoJson
                 
                    var currextent = this._layer.getBounds();
                    var southWest = currextent.getSouthWest();
                    var northEast = currextent.getNorthEast();
                    this._extent = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
                    
                    //this._map.setExtent(this._extent, 'EPSG:4326');


                },
                failure: function(response) {
                    console.log('failed');
                    console.log(response);
                }

            });
        }
    });
    
    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.KML,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.KML',
        factory: PublicaMundi.Leaflet.Layer.KML
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.KML = function (options) {
            switch (typeof options) {

            }
            options.type = options.type || PublicaMundi.LayerType.KML;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, L, jQuery);
;// <reference path="../../../jQuery/jquery-2.1.0.intellisense.js" />
/// <reference path="../../../Leaflet/leaflet-src.js" />

/// <reference path="../../PublicaMundi.js" />
/// <reference path="../Layer.js" />

(function (global, PublicaMundi, L, $) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    if (typeof L === 'undefined') {
        return;
    }
    

    PublicaMundi.define('PublicaMundi.Leaflet.Layer');
    var popup;
    var ajax;
    PublicaMundi.Leaflet.Layer.GeoJson = PublicaMundi.Class(PublicaMundi.Layer, {
        _addToControl: function() { 

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
        onLayerLoad: function() {
        }, 
        // TODO: not yet supported
        fitToMap: function() {
            var layer = this;
            
        },
        initialize: function (options) {
            PublicaMundi.Layer.prototype.initialize.call(this, options);

            options.style = options.style || {normal:{}, highlight:{}};
            this._style.normal = options.style.normal ||  this._style.normal; 
            this._style.highlight = options.style.highlight || this._style.highlight; 

            var auto = this;
            
            if (!PublicaMundi.isDefined(options.projection)) {
                // TODO : Resolve projection / reproject    
            }
            
            var onClick = null;
            if (PublicaMundi.isFunction(options.click)) {
                onClick = function (e) {
                 
                    function highlightFeature(e) {
                        var layer = e.target;
                        var highlightStyle = auto._style.highlight; 

                        if (PublicaMundi.isFunction(highlightStyle)){
                            highlightStyle = highlightStyle(layer.feature);
                        }
                        layer.setStyle(highlightStyle);
                            
                        }
   
                    options.click([e.target.feature.properties], [e.latlng.lat * (6378137), e.latlng.lng* (6378137)]);
             
                    if (this._highlight){
                        if (this._highlight !== e.target){
                            
                            this._lastClicked.resetStyle(map._highlight);
                            
                            this._lastClicked = auto._layer;
                            this._highlight = e.target;
                            highlightFeature(e);
                        }
                        else{
                        }
                    }
                    else{
                        if (this._lastClicked){
                        this._lastClicked.resetStyle(this._highlight);
                        }
                        this._lastClicked = auto._layer;
                        this._highlight = e.target;
                        highlightFeature(e);
                        //highlightStyle(e.target);
                    }               

                };
                }
            
            this._layer = L.geoJson(null, {
                //style: options.style.normal,
                style: this._style.normal,
                //style: function(feature) {
                //        switch (feature.properties.name) {
                //            case 'Zimbabwe': return {color: "#ff0000", fillColor:"#ff0000"};
                //            case 'United States of America':   return {color: "#0000ff", fillColor: "#00ff00"};
        //} 
                //},
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, 
                        //options.style.highlight
                        {
                        radius: 5,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.4,
                        color: "#3399CC",
                        weight: 1.25,
                        opacity: 1
                    }
                        ); 
                    }, 
                 onEachFeature: function onEachFeature(feature, layer) {
                    if (PublicaMundi.isFunction(onClick)) {
                        layer.on({
                            click: onClick,
                            //mouseover: highlightFeature,
                            //mouseout: resetHighlight,
                        });
                    //layer.bindPopup(feature.properties.name);    
                    }
                },
                
            });

            ajax = $.ajax({       
                type: "GET",
                url: options.url,
                dataType: 'json',
                async: true, 
                context: this,
                beforeSend: function(){
                },
                complete: function(){
                },
                success: function (response) {
                    this._layer.addData(response);
                                        
                },
                
                failure: function(response) {
                    console.log('failed');
                    console.log(response);
                }

            });
            
            
        },

    });

    PublicaMundi.registry.registerLayerType({
        layer: PublicaMundi.LayerType.GeoJSON,
        framework: PublicaMundi.Leaflet.Framework,
        type: 'PublicaMundi.Layer.GeoJson',
        factory: PublicaMundi.Leaflet.Layer.GeoJson
    });

    // Add utility methods
    if (PublicaMundi.isDefined(PublicaMundi.Map)) {
        PublicaMundi.Map.prototype.geoJSON = function (options) {
            switch (typeof options) {

            }
            options.type = options.type || PublicaMundi.LayerType.GeoJSON;

            this.createLayer(options);
        };
    }
})(window, window.PublicaMundi, L, jQuery);

//# sourceMappingURL=publicamundi.leaflet-src.js.map