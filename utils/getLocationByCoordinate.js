const axios = require("axios");

const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    const response = await axios.get(url);
    if (response.data.display_name) {
      return response.data.display_name; // Full address
    } else {
      throw new Error("Invalid coordinates");
    }
  } catch (error) {
    console.error("Error fetching address:", error.message);
    return null
  }
};

 module.exports=getAddressFromCoordinates;