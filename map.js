//Set up some of our variables.
let map = null; //Will contain map object.
const markers = [false]; // Array that stores markers ////Has the user plotted their location marker?
const zomato_url = "https://developers.zomato.com/api/v2.1";
const distance_url = "https://maps.googleapis.com/maps/api/distancematrix";
const lineCoordinates = [];
let linePath = null;

//Function called to initialize / create the map.
//This is called when the page has loaded.
function initMap() {
  //The center location of our map.
  const centerOfMap = new google.maps.LatLng(52.357971, -6.516758);

  //Map options.
  const options = {
    center: centerOfMap, //Set center.
    zoom: 7, //The zoom value.
  };

  //Create the map object.
  map = new google.maps.Map(document.getElementById("map"), options);

  //Listen for any clicks on the map.
  google.maps.event.addListener(map, "click", function (event) {
    //Get the location that the user clicked.
    // markers[1].setMap(null);

    const clickedLocation = event.latLng;
    //If the marker hasn't been added.
    if (markers[0] === false) {
      //Create the marker.
      markers[0] = new google.maps.Marker({
        position: clickedLocation,
        title: "My Home",
        map: map,
        icon:
          "http://maps.google.com/mapfiles/ms/micons/homegardenbusiness.png",
        draggable: true, //make it draggable
      });

      //Listen for drag events!
      google.maps.event.addListener(markers[0], "dragend", function (event) {
        markers[1].setMap(null);
        markers[2].setMap(null);
        linePath.setMap(null);
        markerLocation();
      });
    } else {
      markers[1].setMap(null);
      markers[2].setMap(null);
      linePath.setMap(null);
      //Marker has already been added, so just change its location.
      markers[0].setPosition(clickedLocation);
    }
    //Get the marker's location.
    markerLocation();
  });
}

//This function will get the marker's current location and then add the lat/long
//values to our textfields so that we can save the location.
async function markerLocation() {
  //Get location.
  const currentLocation = markers[0].getPosition();
  //Add lat and lng values to a field that we can save.
  document.getElementById("lat").value = currentLocation.lat(); //latitude
  document.getElementById("lng").value = currentLocation.lng(); //longitude
  lineCoordinates[0] = {
    lat: currentLocation.lat(),
    lng: currentLocation.lng(),
  };

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("user-key", "c77e7ec258d5cd8cd8e0443047b2f32d"); //zomato developer api key

  //wait untill the reponce is recieved
  const restaurentPrmoise = await fetch(
    `${zomato_url}/search?entity_type=landmark&count=10&lat=${currentLocation.lat()}&lon=${currentLocation.lng()}&radius=2000&sort=real_distance&order=asc`,
    {
      method: "GET",
      mode: "cors",
      headers: myHeaders,
    }
  );
  const restaurents_responce = await restaurentPrmoise.json();
  // console.log("restaurents", restaurents_responce);
  if (restaurents_responce.restaurants.length > 0) {
    const nearby_restaurent =
      restaurents_responce.restaurants[0].restaurant.location;
    const farby_restaurent =
      restaurents_responce.restaurants[9].restaurant.location;

    const nearby_LatLng = {
      lat: +nearby_restaurent.latitude,
      lng: +nearby_restaurent.longitude,
    };
    lineCoordinates[1] = nearby_LatLng;
    const farby_LatLng = {
      lat: +farby_restaurent.latitude,
      lng: +farby_restaurent.longitude,
    };
    lineCoordinates[2] = farby_LatLng;
    lineCoordinates[3] = lineCoordinates[0];
    markers[1] = new google.maps.Marker({
      position: nearby_LatLng,
      map: map,
      title: "Near Restaurent",
      icon: "http://maps.google.com/mapfiles/ms/micons/restaurant.png",
      draggable: false,
    });

    markers[2] = new google.maps.Marker({
      position: farby_LatLng,
      map: map,
      title: "Far Restaurent",
      icon: "http://maps.google.com/mapfiles/ms/micons/restaurant.png",
      draggable: false,
    });

    linePath = new google.maps.Polyline({
      path: lineCoordinates,
      geodesic: true,
      strokeColor: "#FF0000",
    });
    linePath.setMap(map);

    const home_point = new google.maps.LatLng(lineCoordinates[0]);
    const near_point = new google.maps.LatLng(lineCoordinates[1]);
    const far_point = new google.maps.LatLng(lineCoordinates[2]);

    const area = google.maps.geometry.spherical.computeArea([
      home_point,
      near_point,
      far_point,
    ]);
    const distance_from_home_to_near = google.maps.geometry.spherical.computeDistanceBetween(
      home_point,
      near_point
    );
    const distance_from_near_to_far = google.maps.geometry.spherical.computeDistanceBetween(
      near_point,
      far_point
    );
    const distance_from_far_to_home = google.maps.geometry.spherical.computeDistanceBetween(
      far_point,
      home_point
    );
    const tot_distance =
      distance_from_home_to_near +
      distance_from_near_to_far +
      distance_from_far_to_home;

    document.getElementById("area").value = area;
    const distance_in_km = (tot_distance / 1000).toFixed(); //convert meter to kilometer
    document.getElementById("time").value = distance_in_km / 5;

    // const distancePrmoise = await fetch(
    //   `${distance_url}/json?origins=Vancouver+BC|Seattle&destinations=San+Francisco|Victoria+BC&mode=bicycling&language=fr-FR&key=AIzaSyBtNr6hu2g3JiSpi4GhEfb5TYQCZlGGcuA`,
    //   {
    //     method: "GET",
    //     mode: "cors",
    //     headers: myHeaders,
    //   }
    // );
    // console.log("got it", await distancePrmoise.json());
  }
}

//Load the map when the page has finished loading.
google.maps.event.addDomListener(window, "load", initMap);
