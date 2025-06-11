 const jwt = require('jsonwebtoken')
 
 const createJWT = (id) => {
 return jwt.sign({ id }, process.env.SECRETEKEY, {  // Replace with a strong secret key
    expiresIn: process.env.TOKEN_EXPIRE
  });
};

module.exports=createJWT