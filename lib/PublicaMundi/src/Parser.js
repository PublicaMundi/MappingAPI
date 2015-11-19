(function (window, PublicaMundi) {
    if (typeof PublicaMundi === 'undefined') {
        return;
    }

    PublicaMundi.define('PublicaMundi');

    PublicaMundi.Parser = PublicaMundi.Class({
        initialize: function (options) {
        
        },
        parseWMS: function(responseXML) {
            var obj = {};
            var response;
            // First check if response is valid XML
            try{
                //response = xmlToJson(responseXML, {stripAttrPrefix:true});
                response = xmlToJSON.parseXML(responseXML, {childrenAsArray: false});
            }
            catch(err){
                console.log(err);
                obj.success = false;
                obj.error_msg = "Server response is not a valid XML document. Cannot display";
                return obj;
            }

            //var version = response["version"];
            if (response["ServiceExceptionReport"]){
                obj.success = false;
                obj.error_msg = "Service Exception Report. Please try again.";
                return obj;
                //return false;
            }
            var base = null;
            if (response["WMS_Capabilities"]){
                base = response["WMS_Capabilities"];
            }
            else if (response["WMT_MS_Capabilities"]){
                base = response["WMT_MS_Capabilities"];
                if (base instanceof Array){
                    for (var idx in base){
                        var node = base[idx];
                        if (node["Capability"]){
                            base = node;
                        }
                    }
                    }
            }
            if (!base["_attr"]){
                obj.success = false;
                obj.error_msg = "WMS Capabilities Load Exception. Please try again.";
                return obj;
            }

            obj.version = base["_attr"]["version"]["_value"];
            
            var candidates = [];

            //No layers so return
            if (! base["Capability"]["Layer"]){
                obj.success = false;
                obj.error_msg = "No WMS Layers found in provided endpoint.";
                return obj;
            }
            if (base["Capability"]["Layer"]["Layer"]){
                candidates = base["Capability"]["Layer"]["Layer"];
                }
            else if (base["Capability"]["Layer"]) {
                candidates = base["Capability"]["Layer"];
            }
            if (!(candidates instanceof Array)){
                candidates = [candidates];
            }
             
            for (var idx in candidates){
                var candidate = candidates[idx];
                
                candidate["Name"] = candidate["Name"]["_text"];
                candidate["Title"] = candidate["Title"] ? candidate["Title"]["_text"] : candidate["Name"]["_text"];
                candidate["Abstract"] = candidate["Abstract"] ? candidate["Abstract"]["_text"] : '';
                candidate["CRS"] = candidate["CRS"] ? candidate["CRS"]["_text"] : '';

                var bbox = null;
                var bboxfloat = null;
                if (candidate["EX_GeographicBoundingBox"]){
                    bbox = candidate["EX_GeographicBoundingBox"];
                    var eLng = bbox['eastBoundLongitude']['_text'];
                    var wLng = bbox['westBoundLongitude']['_text'];
                    var nLat = bbox['northBoundLatitude']['_text'];
                    var sLat = bbox['southBoundLatitude']['_text'];

                    bboxfloat = [wLng, sLat, eLng, nLat];
                    candidate["EX_GeographicBoundingBox"] = bboxfloat;
                }
                else if (candidate["LatLonBoundingBox"]) {
                    bbox = candidate["LatLonBoundingBox"]['_attr'];
                    var eLng = bbox['minx']['_value'];
                    var wLng = bbox['maxx']['_value'];
                    var nLat = bbox['maxy']['_value'];
                    var sLat = bbox['miny']['_value'];

                    bboxfloat = [wLng, sLat, eLng, nLat];
                    candidate["EX_GeographicBoundingBox"] = bboxfloat;
                }
            }    
       
            obj.Layer = candidates;
            obj.success = true; 
            return obj;
        },
        
        parseWFS: function(responseXML) {
            var obj = {};
            var response;
            // First check if response is valid XML
            try{
                response = xmlToJSON.parseXML(responseXML, {childrenAsArray: false});
            }
            catch(err){
                console.log(err);
                obj.success = false;
                obj.error_msg = "Server response is not a valid XML document. Cannot display";
                return obj;

            }

            var base = null;
             if (response["WFS_Capabilities"]){
                base = response["WFS_Capabilities"];
            }
            else{
                console.log('unexpected version'); 
                console.log(version); 
                obj.success = false;
                obj.error_msg = "WFS Capabilities error. Could not load layers.";
                return obj;
            }
            var version = null;
            if (base["_attr"]){
                version = base["_attr"]["version"]["_value"];
            }
            obj = base;
            obj.version = version;
   
            var candidates = [];
            if (base["FeatureTypeList"]){
                candidates = base["FeatureTypeList"]["FeatureType"];
            }
            else if (base["wfs:FeatureTypeList"]) {
                candidates = base["wfs:FeatureTypeList"]["wfs:FeatureType"];
            }
            else{
                obj.success = false;
                obj.error_msg = "No WFS Features provided in selected endpoint.";
                return obj;
            }
            for (var idx in candidates){
                var candidate = candidates[idx];
                
                candidate["Name"] = candidate["Name"]["_text"];
                candidate["Title"] = candidate["Title"]["_text"];
                candidate["Abstract"] = candidate["Abstract"]["_text"];
                
                var keywords = [];
                for (var kidx in candidate["Keywords"]["Keyword"]){
                    var current = candidate["Keywords"]["Keyword"][kidx];
                    keywords.push(current["_text"]);
                }
                candidate["Keywords"] = keywords;
                
                var bbox = candidate["WGS84BoundingBox"];
                var bboxfloat = null;
                if (bbox){
                    var lc = bbox['LowerCorner']["_text"].split(' ');
                    var uc = bbox['UpperCorner']["_text"].split(' ');        
                    bboxfloat = [ parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]) ];
                    
                    candidate["WGS84BoundingBox"] = bboxfloat;
                }

                var crs = null;
                if (candidate["DefaultCRS"]){
                    var crs_raw = candidate["DefaultCRS"]["_text"];
                    var crs_arr = crs_raw.split(":");
                    crs = crs_arr[crs_arr.length-3]+":"+crs_arr[crs_arr.length-1];
                    candidate["DefaultCRS"] = crs; 
                }

            } 
            obj.Layer = candidates;

            var format_vals = null;
            if (base["OperationsMetadata"]){
                format_vals = base["OperationsMetadata"]["Operation"];
            }
            obj.Format = format_vals;
                        
            obj.success = true; 
            return obj;
        },

    });

    PublicaMundi.locator.register('PublicaMundi.Parser', PublicaMundi.Parser);
    // Create factory method
    PublicaMundi.parser = function (options) {
        return PublicaMundi.locator.create('PublicaMundi.Parser', options);
    };

})(window, PublicaMundi);
