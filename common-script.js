    PublicaMundi.noConflict();
            
    //Popup handling with Bootstrap
    var onFeatureClick = function(features, coordinate) {
        if (features) {
            feature = features [0];
            }
        if (popup) {
            map.setOverlayPosition(popup, coordinate);
            $(document.getElementById('popup')).popover('destroy');

            var text = JSON.stringify(feature);
            
            $(document.getElementById('popup')).popover({
                'placement' : 'top',
                'animation' : true,
                'html' : true,
                'content' : text
                }).attr('data-original-title');

            $(document.getElementById('popup')).popover('show');
            }
          };

        
    // Map initialization options
    var options = {
        target: 'map',
        center: [2548716, 4643375],
        zoom: 6,
        minZoom: 2,
        maxZoom: 18,
        layerControl: true,        
        layers: [
        {
            title: 'Open Street Maps',
            switcher: 'base',
            type: PublicaMundi.LayerType.TILE,
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }
        ]
    };

    var map, popup;

    PublicaMundi.ready(function () {
        
        //Initialize map with provided options
        map = PublicaMundi.map(options);

        //Initialize popup handler
        popup = map.addOverlay(document.getElementById('popup'));
       
        $(document.getElementById('map')).click(function() { 
            $(document.getElementById('popup')).popover('destroy');
        });

        //Add layers
        // WMS Railway Layer
        var railway = map.createLayer({
            title: 'Railway Network',
            name: 'railway',
            type: PublicaMundi.LayerType.WMS,
            visible: true,
            url: 'http://labs.geodata.gov.gr/geoserver/wms',
            params: { 'layers' : 'publicamundi:c0b70f0a-515d-4a0a-a894-abc412d5239e', 
                  },
            
            });

        
        // KML Ancient theaters Layer
        var theaters = map.createLayer({
            title: 'Ancient Theaters',
            name: 'theaters',
            type: PublicaMundi.LayerType.KML,
            click: onFeatureClick,
            //center: [2548716, 4643375],
            url: 'data/kml/archaia_theatra.kml',
            style: {
                normal:{
                        color: 'black',
                        opacity: 1,
                        fillColor: '#00ff00',
                        fillOpacity: 1
                    },
                highlight:{
                    weight: 3,
                    radius: 10,
                }
                
            },

            });
         
        // WFS parse Capabilities and display layer with name galazies_shmaies_2010
        var parser = PublicaMundi.parser();
        $.ajax({
                url: 'http://labs.geodata.gov.gr/geoserver/wfs?request=GetCapabilities',
            }).then(function(response) {
                
                var result = parser.parseWFS(response);

                for (var idx in result.Layer){
                    var layer = result.Layer[idx];
                    if (layer.Title === 'galazies_shmaies_2008'){
                    map.createLayer({
                        title: layer.Title,
                        type: PublicaMundi.LayerType.WFS,
                        click: onFeatureClick,
                        url: 'http://labs.geodata.gov.gr/geoserver/wfs',
                        visible: false,
                        params: { 'layers' : layer.Name },
                        style:{ normal:{
                                color: 'black',
                                weight: 1,
                                radius: 6,
                                fillColor: '#87beed',
                                fillOpacity: 0.9
                                },
                                highlight:{
                                    fillColor: '#095ba1',
                                }
                            }
                        });
                    }
                }
                });
    })
    

