   var markers = [{
       name: "Shopping Eldorado",
       address: "Av. Rebouças 3970, São Paulo",
       lat: -23.572337,
       lon: -46.695728
   }, {
       name: "Shopping Morumbi",
       address: "Av. Roque Petroni Júnior 1089, São Paulo",
       lat: -23.623190,
       lon: -46.698922
   }, {
       name: "Centro de São Paulo",
       address: "Rua 24 de Maio 70, São Paulo",
       lat: -23.544111,
       lon: -46.639375
   }, {
       name: "Shopping Granja Vianna",
       address: "Rodovia Raposo Tavares Km 23,5, Cotia",
       lat: -23.591397,
       lon: -46.833688
   }, {
       name: "Shopping Tamboré",
       address: "Av Piracema 669, São Paulo",
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
           var functionArray = [];

           var createFunction = function(i) {
               return function() {
                  console.log(i);
                   map.addMarker({
                       'position': coord,
                       'title': currentMarker.name,
                       'snippet': currentMarker.address,
                       'markerClick': function(marker) {
                           marker.showInfoWindow();
                       },
                       'infoClick': function() {

                           launchnavigator.navigate(
                               [markers[i].lat, markers[i].lon], null,
                               function() {
                                   console.log("Plugin success");
                               },
                               function(error) {
                                   console.log("Plugin error: " + error);
                               });
                       }
                   });
               };
           };

           for (var i = 0; i < markers.length; i++) {
               currentMarker = markers[i];

               var coord = new plugin.google.maps.LatLng(currentMarker.lat, currentMarker.lon);
               createFunction(i)();
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