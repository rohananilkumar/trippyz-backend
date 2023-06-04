const rp = require("request-promise");
const $ = require("cheerio");

const getHotelPrice = (hotel) => {
  url = `https://www.tripadvisor.in/Search?q=${hotel}`;
  console.log(hotel);
  rp(url)
    .then(function (html) {
      //success!
      console.log(html);
      console.log($("prw_rup prw_search_search_result_poi", html).length);
      console.log($("prw_rup prw_search_search_result_poi", html));
    })
    .catch(function (err) {
      console.log(err);
    });
};

module.exports = {
  getHotelPrice,
};
