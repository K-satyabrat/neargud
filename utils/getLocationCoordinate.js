const axios = require("axios");

const getCoordinatesFromAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;

    const response = await axios.get(url);
    if (response.data.length > 0) { 
      const location = response.data[0];
      return { latitude: location.lat, longitude: location.lon };
    } else {
      throw new Error("Invalid address");
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return null;
  }
};

module.exports = getCoordinatesFromAddress