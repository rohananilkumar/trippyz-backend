const config = require("config");
const fetch = require("node-fetch");

async function getCoordinates(area) {
  const key = config.get("gmap");
  const areaFetch = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${area}&key=${key}`
  );

  const response = await areaFetch.json();

  return response.results[0].geometry.location;
}

async function getHotels(area, radius) {
  const key = config.get("gmap");
  const coordinates = await getCoordinates(area);

  const hotelsRequestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&keyword=hotel&key=${key}`;
  const hotelsRequest = await fetch(hotelsRequestUrl);

  return hotelsRequest.json();
}

async function getHotelDetails(placeId) {
  const key = config.get("gmap");

  const hotelPriceLevelUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,price_level,formatted_phone_number&key=${key}`;
  const response = await fetch(hotelPriceLevelUrl);

  return response.json();
}

async function getRestaurants(area, radius) {
  const key = config.get("gmap");
  const coordinates = await getCoordinates(area);

  const restaurantesRequestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&keyword=restaurant&key=${key}`;
  const restauranteRequest = await fetch(restaurantesRequestUrl);
  return restauranteRequest.json();
}

async function getRestaurantDetails(placeId) {
  const key = config.get("gmap");

  const restaurantPriceLevelsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,price_level,reviews&key=${key}`;
  const response = await fetch(restaurantPriceLevelsUrl);
  return await response.json();
}

async function getTouristPlaces(area, radius) {
  const key = config.get("gmap");
  const coordinates = await getCoordinates(area);

  const type = "tourist_attraction";
  const requeststring = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&type=${type}&key=${key}`;
  const tourismResponse = await fetch(requeststring);
  return tourismResponse.json();
}

module.exports = {
  getCoordinates,
  getHotels,
  getHotelDetails,
  getRestaurants,
  getRestaurantDetails,
  getTouristPlaces,
};
