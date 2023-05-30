const { googleMapsClient } = require("../startup/gmap");

const breaks = {
  breakfast: 8 * 60,
  lunch: 13 * 60,
  dinner: 18 * 60,
};

const parseDuration = (duration) => {
  const split = duration.split(" ");
  const days = parseInt(split[0]);
  const hours = parseInt(split[2]);
  const minutes = days * 1440 + hours * 60;
  return minutes;
};

const findNewPoint = async ({
  current,
  places,
  points,
  duration,
  startTime,
  durationPerVisit,
}) => {
  const nearest = await getNearestPlace(current, places);
  const newPlaces = filter(nearest.place, places);
  points.push({
    place: nearest.place,
    time: duration + startTime,
    hours: (duration + startTime) / 60,
    mins: (duration + startTime) % 60,
    break: undefined,
  });
  console.log("pushing ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newPlaces,
  };
};

const findNewRestaurant = async ({
  current,
  restaurants,
  points,
  duration,
  startTime,
  durationPerVisit,
  breakType,
}) => {
  const nearest = await getNearestPlace(current, restaurants);
  const newRestaurants = filter(nearest.place, restaurants);
  points.push({
    place: nearest.place,
    time: duration + startTime,
    hours: (duration + startTime) / 60,
    mins: (duration + startTime) % 60,
    break: breakType,
  });
  console.log(breakType, " at ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newRestaurants,
  };
};

const dayRoute = async (startPoint, placeList, restaurantList, percent = 1) => {
  const points = [{ place: startPoint }];
  let places = placeList;
  let nearest;
  let duration = 0;
  let current = startPoint;
  const maxDuration = 11 * 60;
  const durationPerVisit = 60;
  const startTime = 6 * 60;
  const breakComplete = {
    breakfast: false,
    lunch: false,
    dinner: false,
  };

  while (duration < maxDuration && places.length > 0) {
    // console.log(current, nearest, places, duration);
    if (duration + startTime > breaks.breakfast && !breakComplete.breakfast) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        breakType: "breakfast",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.breakfast = true;
    } else if (duration + startTime > breaks.lunch && !breakComplete.lunch) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        breakType: "lunch",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.lunch = true;
    } else if (duration + startTime > breaks.dinner && !breakComplete.dinner) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        breakType: "dinner",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.dinner = true;
    } else {
      const newPoint = await findNewPoint({
        current,
        places,
        points,
        duration,
        startTime,
        durationPerVisit,
      });

      // console.log(newPoint);

      duration = newPoint.duration;
      current = newPoint.nearest;
      places = newPoint.places;
    }

    // console.log(current, duration);
  }

  return points;
};

const filter = (point, placeList) => {
  return placeList.filter((x) => x != point);
};

//TODO:Work on this
const getNearestPlaceBetweenTwoPoints = async (start, end, places) => {
  const nearestPlaceMatrix = await googleMapsClient
    .distanceMatrix({
      origins: [start, end],
      destinations: places,
    })
    .asPromise();
  rows = await nearestPlaceMatrix.json.rows;
  // console.log(rows[0].elements);

  let startingPoint = 0;
  for (let i = 0; i < places.length; i++) {
    if (
      rows[0].elements[i].distance.value <
      rows[0].elements[startingPoint].distance.value
    ) {
      startingPoint = i;
    }
  }

  return {
    place: places[startingPoint],
    duration: rows[0].elements[startingPoint].duration.value,
    distance: rows[0].elements[startingPoint].distance.value,
  };
};

const getNearestPlace = async (start, places) => {
  const nearestPlaceMatrix = await googleMapsClient
    .distanceMatrix({
      origins: [start],
      destinations: places,
    })
    .asPromise();
  rows = await nearestPlaceMatrix.json.rows;
  // console.log(rows[0].elements);

  let startingPoint = 0;
  for (let i = 0; i < places.length; i++) {
    if (
      rows[0].elements[i].distance.value <
      rows[0].elements[startingPoint].distance.value
    ) {
      startingPoint = i;
    }
  }

  return {
    place: places[startingPoint],
    duration: rows[0].elements[startingPoint].duration.value,
    distance: rows[0].elements[startingPoint].distance.value,
  };
};

module.exports = {
  parseDuration,
  filter,
  getNearestPlace,
  dayRoute,
};
