const { googleMapsClient } = require("../startup/gmap");

async function getCoordinates(area) {
  const response = await googleMapsClient
    .geocode({
      address: area,
    })
    .asPromise();

  return response.json.results[0].geometry.location;
}

async function getCoordinatesString(area) {
  const coordinates = await getCoordinates(area);
  return `${coordinates.lat},${coordinates.lng}`;
}

async function getCoordinatesList(areas) {
  const coordinates = [];
  for (const x of areas) {
    const coordinate = await getCoordinates(x);
    coordinates.push(coordinate);
  }
  return coordinates;
}

async function getHotels(area, radius) {
  const coordinates = await getCoordinatesString(area);
  const type = "lodging";
  try {
    const tourismResponse = await googleMapsClient
      .placesNearby({ location: coordinates, radius, type })
      .asPromise();

    return tourismResponse.json;
  } catch (e) {
    console.log(e);
  }
}

async function getRestaurants(area, radius) {
  const coordinates = await getCoordinatesString(area);
  try {
    const response = await googleMapsClient
      .placesNearby({ location: coordinates, radius, type: "restaurant" })
      .asPromise();

    return response.json;
  } catch (e) {
    console.log(e);
  }
}

async function getPlaceDetailsFromPlaceId(placeId) {
  const response = await googleMapsClient
    .place({
      placeid: placeId,
      fields: [
        "name",
        "formatted_address",
        "rating",
        "price_level",
        "reviews",
        "opening_hours",
        "photo",
      ],
    })
    .asPromise();

  return response.json;
}

async function getPlaceDetails(place) {
  const response = await googleMapsClient.places({ query: place }).asPromise();
  return response.json;
}

async function getTouristPlaces(area, radius) {
  const coordinates = await getCoordinatesString(area);
  const type = "tourist_attraction";
  try {
    const tourismResponse = await googleMapsClient
      .placesNearby({ location: coordinates, radius, type })
      .asPromise();

    return tourismResponse.json;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getCoordinates,
  getHotels,
  getRestaurants,
  getTouristPlaces,
  getPlaceDetailsFromPlaceId,
  getPlaceDetails,
  getCoordinatesList,
};
