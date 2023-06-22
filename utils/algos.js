const { googleMapsClient } = require("../startup/gmap");
const { DOLLAR_TO_INR, DIESEL_PRICE, PETROL_PRICE } = require("./constants");

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
  vehicleType,
}) => {
  const nearest = await getNearestPlace(current, places);
  const newPlaces = filter(nearest.place, places);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime + nearest.duration / 60),
    hours: roundTime((duration + startTime + nearest.duration / 60) / 60),
    mins: roundTime((duration + startTime + nearest.duration / 60) % 60),
    break: undefined,
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
  });
  console.log("pushing ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newPlaces,
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
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
  vehicleType,
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
      distancePrice: calculateMileage(
        returnData.distance.value,
        mileage,
        vehicleType
      ),
      returnData,
    });
    console.log(
      calculateMileage(returnData.distance.value, mileage, vehicleType),
      returnData.distance.value,
      mileage,
      "distace data"
    );
    return {
      distancePrice: calculateMileage(
        returnData.distance.value,
        mileage,
        vehicleType
      ),
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
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
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
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
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
  vehicleType,
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
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
  });
  console.log(breakType, " at ", nearest.place);
  // current = nearest.place;
  return {
    duration: duration + nearest.duration / 60 + durationPerVisit,
    nearest: nearest.place,
    places: newRestaurants,
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
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
  peopleCount,
  vehicleType,
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
  const price =
    (peopleCount / 2) * priceDetails.price +
    (peopleCount % 2) * priceDetails.price;
  const newHotels = filter(nearest.place, hotels);
  points.push({
    place: nearest.place,
    time: roundTime(duration + startTime),
    hours: roundTime((duration + startTime) / 60),
    mins: roundTime((duration + startTime) % 60),
    break: breakType,
    hotelPrice: price * DOLLAR_TO_INR,
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
  });
  console.log(breakType, " at ", nearest.place);

  // current = nearest.place;
  return {
    duration: "overnight",
    nearest: nearest.place,
    hotelPrice: price * DOLLAR_TO_INR,
    places: newHotels,
    distancePrice: calculateMileage(nearest.distance, mileage, vehicleType),
  };
};

const roundTime = (value) => {
  return parseInt(value.toFixed(0));
};
const roundMoney = (value) => {
  return parseInt(value.toFixed(2));
};
const calculateMileage = (distance, mileage, vehicleType) => {
  return roundMoney(
    (distance / 1000 / mileage) * vehicleType === "petrol"
      ? PETROL_PRICE
      : DIESEL_PRICE
  );
};

const dayRoute = async (
  startPoint,
  placeList,
  restaurantList,
  hotelList,
  mileage,
  durationPerVisit = 60,
  peopleCount = 1,
  vehicleType = "petrol"
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
        vehicleType,
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
        vehicleType,
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
        vehicleType,
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
        vehicleType,
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
    peopleCount,
  });

  duration = stay.duration;
  current = stay.nearest;
  hotelList = stay.places;
  fuelPrice += stay.distancePrice;

  hotelPrice +=
    (peopleCount / 2) * stay.hotelPrice + (peopleCount % 2) * stay.hotelPrice;

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

const dayRouteRoundTrip = async (
  startPoint,
  placeList,
  restaurantList,
  mileage,

  durationPerVisit = 60,
  peopleCount = 1,
  vehicleType = "petrol"
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
  let fuelPrice = 0;
  let hotelPrice = 0;

  while (
    duration < maxDuration &&
    duration + durationback < maxDuration &&
    places.length > 0
  ) {
    console.log(fuelPrice, "fuelPrice");

    // console.log(current, nearest, places, duration);
    if (duration + startTime > breaks.breakfast && !breakComplete.breakfast) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        mileage,
        durationPerVisit,
        breakType: "breakfast",
        vehicleType,
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      breakComplete.breakfast = true;
      console.log("finding restaurant for breakfast");
    } else if (duration + startTime > breaks.lunch && !breakComplete.lunch) {
      const newPoint = await findNewRestaurant({
        current,
        restaurants: restaurantList,
        points,
        duration,
        startTime,
        durationPerVisit,
        breakType: "lunch",
        mileage,
        vehicleType,
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      console.log("finding restaurant for lunch");

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
        vehicleType,
      });

      duration = newPoint.duration;
      current = newPoint.nearest;
      restaurantList = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      console.log("finding restaurant for dinner");

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
        vehicleType,
      });

      // console.log(newPoint);

      duration = newPoint.duration;
      current = newPoint.nearest;
      places = newPoint.places;
      fuelPrice += newPoint.distancePrice;
      console.log("finding new place", newPoint.distancePrice);
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
    vehicleType,
  });

  return {
    route: points,
    updatedPlaceList: places,
    updatedRestaurantList: restaurantList,
    fuelPrice,
    hotelPrice,
  };
};

const dayRouteReturnTrip = async (
  startPoint,
  placeList,
  restaurantList,
  endPoint,
  mileage,
  durationPerVisit = 60,
  peopleCount = 1,
  vehicleType = "petrol"
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
        vehicleType,
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
        vehicleType,
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
        vehicleType,
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
        vehicleType,
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
    vehicleType,
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
  dayRouteRoundTrip,
  dayRoute,
  dayRouteReturnTrip,
  filterPlaces,
  filterHotels,
};
