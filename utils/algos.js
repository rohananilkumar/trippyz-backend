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
    time: duration + startTime + nearest.duration / 60,
    hours: (duration + startTime + nearest.duration / 60) / 60,
    mins: (duration + startTime + nearest.duration / 60) % 60,
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

const findNewPointAndReturn = async ({
  current,
  places,
  points,
  returnDest,
  duration,
  startTime,
  durationPerVisit,
  returnToDest = false,
}) => {
  if (returnToDest) {
    const returnData = await getDistanceBetweenTwoPoints(current, returnDest);
    points.push({
      place: returnDest,
      time: duration + startTime + returnData.duration.value / 60,
      hours: (duration + startTime + returnData.duration.value / 60) / 60,
      mins: (duration + startTime + returnData.duration.value / 60) % 60,
      break: undefined,
      returnData,
    });
    return {};
  }

  const nearest = await getNearestPlace(current, places);
  const newPlaces = filter(nearest.place, places);
  points.push({
    place: nearest.place,
    time: duration + startTime + nearest.duration / 60,
    hours: (duration + startTime + nearest.duration / 60) / 60,
    mins: (duration + startTime + nearest.duration / 60) % 60,
    break: undefined,
  });
  console.log("pushing ", nearest.place);
  const returnData = await getDistanceBetweenTwoPoints(
    nearest.place,
    returnDest
  );
  // current = nearest.place;
  return {
    durationBack: returnData.duration.value / 60,
    distanceBack: returnData.distance.value,
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

const dayRouteRoudTrip = async (startPoint, placeList, restaurantList) => {
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
  let durationback = 0;

  while (
    duration < maxDuration &&
    duration + durationback < maxDuration &&
    places.length > 0
  ) {
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
      const newPoint = await findNewPointAndReturn({
        current,
        places,
        points,
        duration,
        startTime,
        durationPerVisit,
        returnDest: startPoint,
      });

      // console.log(newPoint);

      duration = newPoint.duration;
      current = newPoint.nearest;
      places = newPoint.places;
      console.log("from back duration", newPoint.durationBack);
      console.log("startpoint", startPoint);
      durationBack = newPoint.durationBack;
    }

    // console.log(current, duration);
  }

  await findNewPointAndReturn({
    current,
    places,
    points,
    duration,
    startTime,
    durationPerVisit,
    returnDest: startPoint,
    returnToDest: true,
  });

  return points;
};

const dayRouteReturnTrip = async (start, places, end) => {};

// const getNearestTouristDestinationFromPoint = async (point,radius) => {
//    const places = await getTouristPlaces(point, 20000);
//    const placeNames = places.results.map(
//      (place) => place.name + ", " + value.dest
//    );
// };

const getDistanceBetweenTwoPoints = async (start, end) => {
  const nearestPlaceMatrix = await googleMapsClient
    .distanceMatrix({
      origins: [start],
      destinations: [end],
    })
    .asPromise();
  rows = await nearestPlaceMatrix.json.rows;
  return rows[0].elements[0];
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
  dayRouteRoudTrip,
  dayRoute,
};
