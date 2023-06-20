const { googleMapsClient } = require("../startup/gmap");
const { DOLLAR_TO_INR, DIESEL_PRICE } = require("./constants");

const breaks = {
  breakfast: 8 * 60,
  lunch: 13 * 60,
  dinner: 18 * 60,
};

const parseDuration = (duration) => {
  return duration * 1440;
};

const findNewPoint = async ({
  current,
  places,
  points,
  duration,
  startTime,
  durationPerVisit,
  mileage,
}) => {
  const nearest = await getNearestPlace(current, places);
  const newPlaces = filter(nearest.place, places);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime + nearest.duration / 60),
    hours: roundTime((duration + startTime + nearest.duration / 60) / 60),
    mins: roundTime((duration + startTime + nearest.duration / 60) % 60),
    break: undefined,
    distancePrice: calculateMileage(nearest.distance, mileage),
  });
  console.log("pushing ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newPlaces,
    distancePrice: calculateMileage(nearest.distance, mileage),
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
  mileage,
}) => {
  if (returnToDest) {
    const returnData = await getDistanceBetweenTwoPoints(current, returnDest);
    points.push({
      place: returnDest,
      time: roundTime(duration + startTime + returnData.duration.value / 60),
      hours: roundTime(
        (duration + startTime + returnData.duration.value / 60) / 60
      ),
      mins: roundTime(
        (duration + startTime + returnData.duration.value / 60) % 60
      ),
      break: undefined,
      distancePrice: calculateMileage(returnData.distance.value, mileage),
      returnData,
    });
    console.log(
      calculateMileage(returnData.distance.value, mileage),
      returnData.distance.value,
      mileage,
      "distace data"
    );
    return {
      distancePrice: calculateMileage(returnData.distance.value, mileage),
    };
  }

  const nearest = await getNearestPlace(current, places);
  const newPlaces = filter(nearest.place, places);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime + nearest.duration / 60),
    hours: roundTime((duration + startTime + nearest.duration / 60) / 60),
    mins: roundTime((duration + startTime + nearest.duration / 60) % 60),
    break: undefined,
    distancePrice: calculateMileage(nearest.distance, mileage),
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
    distancePrice: calculateMileage(nearest.distance, mileage),
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
  mileage,
}) => {
  console.log("Finding new restaurant");
  const nearest = await getNearestPlace(current, restaurants);
  const newRestaurants = filter(nearest.place, restaurants);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime),
    hours: roundTime((duration + startTime) / 60),
    mins: roundTime((duration + startTime) % 60),
    break: breakType,
    distancePrice: calculateMileage(nearest.distance, mileage),
  });
  console.log(breakType, " at ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newRestaurants,
    distancePrice: calculateMileage(nearest.distance, mileage),
  };
};

const findNewHotel = async ({
  current,
  hotels,
  points,
  duration,
  startTime,
  breakType,
  mileage,
}) => {
  // console.log("Finding new hotel", hotels, current);
  console.log("hotels", hotels);
  const nearest = await getNearestPlace(
    current,
    hotels.map((x) => x.price.HotelName)
  );
  console.log("hotel nearest details = ", nearest);
  const priceDetails = hotels.find(
    (x) => x.price.HotelName == nearest.place
  ).price;
  const newHotels = filter(nearest.place, hotels);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime),
    hours: roundTime((duration + startTime) / 60),
    mins: roundTime((duration + startTime) % 60),
    break: breakType,
    hotelPrice: priceDetails.price * DOLLAR_TO_INR,
    distancePrice: calculateMileage(nearest.distance, mileage),
  });
  console.log(breakType, " at ", nearest.place);

  // current = nearest.place;
  return {
    duration: "overnight",
    nearest: nearest.place,
    hotelPrice: priceDetails.price * DOLLAR_TO_INR,
    places: newHotels,
    distancePrice: calculateMileage(nearest.distance, mileage),
  };
};

const roundTime = (value) => {
  return parseInt(value.toFixed(0));
};
const roundMoney = (value) => {
  return parseInt(value.toFixed(2));
};
const calculateMileage = (distance, mileage) => {
  return roundMoney((distance / 1000 / mileage) * DIESEL_PRICE);
};

const dayRoute = async (
  startPoint,
  placeList,
  restaurantList,
  hotelList,
  mileage,
  durationPerVisit = 60
) => {
  console.log("from day route", hotelList);
  const points = [{ place: startPoint }];
  let places = placeList;
  let nearest;
  let duration = 0;
  let current = startPoint;
  const maxDuration = 11 * 60;
  const startTime = 6 * 60;
  let fuelPrice = 0;
  let hotelPrice = 0;
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
        mileage,
        breakType: "breakfast",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      breakComplete.breakfast = true;
    } else if (duration + startTime > breaks.lunch && !breakComplete.lunch) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        mileage,
        durationPerVisit,
        breakType: "lunch",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.lunch = true;
      fuelPrice += newPoint.distancePrice;
    } else if (duration + startTime > breaks.dinner && !breakComplete.dinner) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        mileage,
        breakType: "dinner",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.dinner = true;
      fuelPrice += newPoint.distancePrice;
    } else {
      const newPoint = await findNewPoint({
        current,
        places,
        points,
        duration,
        startTime,
        durationPerVisit,
        mileage,
      });

      // console.log(newPoint);

      duration = newPoint.duration;
      current = newPoint.nearest;
      places = newPoint.places;
      fuelPrice += newPoint.distancePrice;
    }

    // console.log(current, duration);
  }

  const stay = await findNewHotel({
    current,
    hotels: hotelList,
    points,
    duration,
    startTime,
    breakType: "stay",
    mileage,
  });

  duration = stay.duration;
  current = stay.nearest;
  hotelList = stay.places;
  fuelPrice += stay.distancePrice;
  hotelPrice += stay.hotelPrice;

  return {
    route: points,
    updatedPlaceList: places,
    updatedRestaurantList: restaurantList,
    updatedHotelList: hotelList,
    fuelPrice,
    hotelPrice,
  };
};

const filter = (point, placeList) => {
  return placeList.filter((x) => x != point);
};

const dayRouteRoudTrip = async (
  startPoint,
  placeList,
  restaurantList,
  durationPerVisit = 60
) => {
  const points = [{ place: startPoint }];
  let places = placeList;
  let nearest;
  let duration = 0;
  let current = startPoint;
  const maxDuration = 11 * 60;
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
        mileage,
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
    mileage,
    durationPerVisit,
    returnDest: startPoint,
    returnToDest: true,
  });

  return {
    route: points,
    updatedPlaceList: places,
    updatedRestaurantList: restaurantList,
  };
};

const dayRouteReturnTrip = async (
  startPoint,
  placeList,
  restaurantList,
  endPoint,
  mileage,
  durationPerVisit = 60
) => {
  const points = [{ place: startPoint }];
  let places = placeList;
  let nearest;
  let duration = 0;
  let current = startPoint;
  let fuelPrice = 0;
  let hotelPrice = 0;
  const maxDuration = 11 * 60;
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
        mileage,
        breakType: "breakfast",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      breakComplete.breakfast = true;
    } else if (duration + startTime > breaks.lunch && !breakComplete.lunch) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        mileage,
        breakType: "lunch",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;

      breakComplete.lunch = true;
    } else if (duration + startTime > breaks.dinner && !breakComplete.dinner) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        mileage,
        breakType: "dinner",
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      breakComplete.dinner = true;
      fuelPrice += newPoint.distancePrice;
    } else {
      const newPoint = await findNewPointAndReturn({
        current,
        places,
        points,
        duration,
        startTime,
        durationPerVisit,
        mileage,
        returnDest: endPoint,
      });

      // console.log(newPoint);

      duration = newPoint.duration;
      current = newPoint.nearest;
      places = newPoint.places;
      console.log("from back duration", newPoint.durationBack);
      console.log("startpoint", startPoint);
      durationBack = newPoint.durationBack;
      fuelPrice += newPoint.distancePrice;
    }

    // console.log(current, duration);
  }

  const newPoint = await findNewPointAndReturn({
    current,
    places,
    points,
    duration,
    startTime,
    durationPerVisit,
    returnDest: endPoint,
    mileage,
    returnToDest: true,
  });
  fuelPrice += newPoint.distancePrice;

  return {
    route: points,
    updatedPlaceList: places,
    updatedRestaurantList: restaurantList,
    fuelPrice,
    hotelPrice,
  };
};

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
  // console.log(rows[0].elements);

  let startingPoint = 0;
  for (let i = 0; i < places.length; i++) {
    if (rows[0].elements[i].status === "NOT_FOUND") continue;
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

const filterPlaces = (places) => {
  let totalRatings = 0;
  // array.forEach((element) => {});
  places.forEach((x) => {
    console.log(x.user_ratings_total);
    totalRatings += x.user_ratings_total ? x.user_ratings_total : 0;
  });
  const averageRatings = totalRatings / places.length;
  console.log("average ratings", averageRatings);
  return places.filter((x) => x.user_ratings_total > averageRatings / 2);
  // return places;
};

const filterHotels = (hotels, type) => {
  const hotelStats = {
    cheap: 0,
    moderate: 0,
    expensive: 0,
    higestPrice: 0,
    lowestPrice: 99999,
  };
  hotels.forEach((x) => {
    hotelStats.moderate += x.price.price;
    if (x.price.price > hotelStats.higestPrice) {
      hotelStats.higestPrice = x.price.price;
    }
    if (x.price.price < hotelStats.lowestPrice) {
      hotelStats.lowestPrice = x.price.price;
    }
  });

  hotelStats.moderate = hotelStats.moderate / hotels.length;
  hotelStats.cheap = (hotelStats.lowestPrice + hotelStats.moderate) / 2;
  hotelStats.expensive = (hotelStats.higestPrice + hotelStats.moderate) / 2;
  const filteredList = [];
  console.log(hotelStats);
  if (type === "expensive") {
    hotels.forEach((x) => {
      console.log("checking expensive ", x.price.price);
      if (
        x.price.price >= hotelStats.moderate &&
        x.price.price <= hotelStats.higestPrice
      ) {
        filteredList.push(x);
        console.log("yes");
      }
    });
  } else if (type === "cheap") {
    hotels.forEach((x) => {
      console.log("checking cheap ", x.price.price);

      if (
        x.price.price >= hotelStats.lowestPrice &&
        x.price.price <= hotelStats.moderate
      ) {
        filteredList.push(x);
        console.log("yes");
      }
    });
  } else if (type === "moderate") {
    hotels.forEach((x) => {
      console.log("checking moderate ", x.price.price);

      if (
        x.price.price >= hotelStats.cheap &&
        x.price.price <= hotelStats.expensive
      ) {
        filteredList.push(x);
        console.log("yes");
      }
    });
  }
  return filteredList;
};

module.exports = {
  parseDuration,
  filter,
  getNearestPlace,
  dayRouteRoudTrip,
  dayRoute,
  dayRouteReturnTrip,
  filterPlaces,
  filterHotels,
};
