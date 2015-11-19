module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                reporter: require('jshint-stylish')
            },
            publicamundi: ['src/*.js'],
            openlayers: ['src/lib/ol/*.js'],
            leaflet: ['src/lib/leaflet/*.js']
        },
        copy: {
            openlayers: {
                files: [{
                    expand: true,
                    cwd: 'OpenLayers/',
                    src: ['**'],
                    dest: 'build/lib/ol/'
                }, {
                    expand: true,
                    cwd: '../ol3-layerswitcher/src/',
                    src: ['ol3-layerswitcher.css'],
                    dest: 'build/lib/ol/'
                }]
            },
            leaflet: {
                files: [{
                    expand: true,
                    cwd: 'Leaflet/',
                    src: ['leaflet.js', 'leaflet.css'],
                    dest: 'build/lib/leaflet/'
                }, {
                    expand: true,
                    cwd: 'Leaflet/images/',
                    src: ['**'],
                    dest: 'build/lib/leaflet/images/'
                }]
            }
        },
        concat: {
            options: {
                banner: '/* <%= pkg.description %> version <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                separator: ';',
                sourceMap: true
            },
            publicamundi: {
                src: ['../xmlToJSON/lib/xmlToJSON.js',
                      'src/PublicaMundi.js',
                      'src/Map.js',
                      'src/Helpers.js',
                      'src/Parser.js',
                      'src/Layer.js'],
                dest: 'build/publicamundi-src.js'
            },
            openlayers: {
                src: ['src/lib/ol/PublicaMundi.OpenLayers.js',
                      '../ol3-layerswitcher/src/ol3-layerswitcher.js',
                      'src/lib/ol/Map.js',
                      'src/lib/ol/Helpers.js',
                      'src/lib/ol/Layer.WMS.js',
                      'src/lib/ol/Layer.WFS.js',
                      'src/lib/ol/Layer.Tile.js',
                      'src/lib/ol/Layer.KML.js',
                      'src/lib/ol/Layer.GML.js',
                      'src/lib/ol/Layer.GeoJson.js'],
                dest: 'build/publicamundi.ol-src.js'
            },
            leaflet: {
                src: ['src/lib/leaflet/PublicaMundi.Leaflet.js',
                      '../togeojson/togeojson.js',
                      '../proj4js/proj4.js',
                      '../proj4jsleaflet/proj4leaflet.js',
                      'src/lib/leaflet/Map.js',
                      'src/lib/leaflet/Layer.WMS.js',
                      'src/lib/leaflet/Layer.WFS.js',
                      'src/lib/leaflet/Layer.Tile.js',
                      'src/lib/leaflet/Layer.KML.js',
                      'src/lib/leaflet/Layer.GML.js',
                      'src/lib/leaflet/Layer.GeoJson.js'],
                dest: 'build/publicamundi.leaflet-src.js'
            }
        },
        uglify: {
            options: {
                banner: '/* <%= pkg.description %> version <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: true
            },
            publicamundi: {
                src: 'build/publicamundi-src.js',
                dest: 'build/publicamundi.js'
            },
            openlayers: {
                src: 'build/publicamundi.ol-src.js',
                dest: 'build/publicamundi.ol.js'
            },
            leaflet: {
                src: 'build/publicamundi.leaflet-src.js',
                dest: 'build/publicamundi.leaflet.js'
            }
            /*files: {
              'build/publicamundi.min.js': ['build/publicamundi.js']
            }*/
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'copy']);

};
