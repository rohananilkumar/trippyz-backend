// import { place } from './places.js';
const axios = require("axios");

const fetchHotelData = async (query) => {
  const url = "https://api.makcorps.com/auth";
  const data = {
    username: "adi", //API USERNAME
    password: "9z39afUKch3NFY@", //PASSWORD
  };

  const response = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(response.data); //Displays the JWT Token
  const token = response.data["access_token"]; //stores the jwt token

  const searchQuery = query;
  const link = `https://api.makcorps.com/free/${searchQuery}`; //url to fetch the data
  const headers = {
    Authorization: `JWT ${token}`,
  };

  const response2 = await axios.get(link, { headers });
  //   console.log(response2.data);
  const hotel = response2.data.Comparison.filter((item) => item != null);

  let price = 1000000;
  let small = 1000000;
  let vendor = "";
  const collection = []; //Array to store hotels and prices
  for (let j = 0; j < 10; j++) {
    const hotelstay = hotel[j][1][0];
    if (hotelstay != null) {
      for (let i = 0; i < 5; i++) {
        const cost = parseInt(hotel[j][1][i]["price" + (i + 1)]);
        const vend = hotel[j][1][i]["vendor" + (i + 1)];
        if (!isNaN(cost)) price = cost;

        if (price < small) {
          small = price;
          vendor = vend;
        } //Find the smallest listed price
      }
      collection.push({
        HotelName: hotel[j][0]["hotelName"],
        price: small,
        vendor,
      });
      small = 100000;
    }
  }
  //   console.log(`Hotels in ${searchQuery}\n`);
  //   console.log(collection); //Displays the hotels and its smallest price listed
  //return collection;
  return collection;
};

module.exports = {
  fetchHotelData,
};
