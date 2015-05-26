   var markers = [{
       name: "Shopping Eldorado",
       address: "Av. Rebouças 3970",
       lat: -23.572337,
       lon: -46.695728
   }, {
       name: "Shopping Morumbi",
       address: "Av. Roque Petroni Júnior 1089",
       lat: -23.623190,
       lon: -46.698922
   }, {
       name: "Centro de São Paulo",
       address: "Rua 24 de Maio 70",
       lat: -23.544111,
       lon: -46.639375
   }, {
       name: "Shopping Granja Vianna",
       address: "Rod Raposo Tavares Km 23,5",
       lat: -23.591397,
       lon: -46.833688
   }, {
       name: "Shopping Tamboré",
       address: "Av Piracema 669",
       lat: -23.504158,
       lon: -46.834677
   }];

   var map;
   document.addEventListener("deviceready", function() {
       var div = document.getElementById("map_canvas");

       // Initialize the map view
       var SP = new plugin.google.maps.LatLng(-23.550520, -46.633309);
       var map = plugin.google.maps.Map.getMap(div, {
           'camera': {
               'latLng': SP,
               'zoom': 12
           }
       });

       // Wait until the map is ready status.
       map.addEventListener(plugin.google.maps.event.MAP_READY, function() {

           var button = document.getElementById("button");
           button.addEventListener("click", function() {
               map.showDialog();
           }, false);

           for (var i = 0; i < markers.length; i++) {
               currentMarker = markers[i];
               var coord = new plugin.google.maps.LatLng(currentMarker.lat, currentMarker.lon);
               map.addMarker({
                   'position': coord,
                   'title': currentMarker.name,
                   'snippet': currentMarker.address,
                   'markerClick': function(marker) {
                       marker.showInfoWindow();
                   },
                   'infoClick': function(marker) {
                       console.log(marker);

                       var locationSuccess = function(location) {
                           console.log("Location:");
                           console.log(location);
                           launchnavigator.navigate(
                               [currentMarker.lat, currentMarker.lon], null,
                               function() {
                                   console.log("Plugin success");
                               },
                               function(error) {
                                   console.log("Plugin error: " + error);
                               });
                           // var request = {
                           //     'position': location.latLng
                           // };

                           //                            plugin.google.maps.Geocoder.geocode(request, function(results) {
                           //                                if (results.length) {
                           //                                    var result = results[0];
                           //                                    var position = result.position;
                           //                                    var address = [
                           //                                        result.subThoroughfare || "",
                           //                                        result.thoroughfare || "",
                           //                                        result.locality || "",
                           //                                        result.adminArea || "",
                           //                                        result.postalCode || "",
                           //                                        result.country || ""
                           //                                    ].join(", ");

                           //                                    var sourceAddress = "saddr=" + address;
                           //                                    var destAddress = "daddr=" + currentMarker.address;

                           // //                                   var deviceType = (navigator.userAgent.match(/iPad/i)) == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i)) == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";


                           // //                                   var url = "";

                           //                                    // if (deviceType == "Android") {
                           //                                    //     url = "geo:?" + sourceAddress + "&" + destAddress;
                           //                                    // } else if (deviceType == "iPad" || deviceType == "iPhone") {
                           //                                    //     url = "maps://maps.apple.com/?" + sourceAddress + "&" + destAddress;
                           //                                    // }                                  
                           //                                    // window.open(url, '_system',"");

                           //                                } else {
                           //                                    console.log("Not found");
                           //                                }


                           // });
                       };

                       map.getMyLocation(locationSuccess, onError);
                   }
               });
           }

           var onSuccess = function(location) {
               var msg = ["Current your location:\n",
                   "latitude:" + location.latLng.lat,
                   "longitude:" + location.latLng.lng,
                   "speed:" + location.speed,
                   "time:" + location.time,
                   "bearing:" + location.bearing
               ].join("\n");

               map.addMarker({
                   'icon': 'blue',
                   'position': location.latLng,
                   'title': msg
               }, function(marker) {
                   marker.showInfoWindow();
               });
           };

           var onError = function(msg) {
               console.log("error: " + msg);
           };
           map.getMyLocation(onSuccess, onError);
       });

   }, false);