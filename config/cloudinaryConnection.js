const cloudinary = require("cloudinary").v2;



   const cloudinaryConnecte =()=>{
    try{
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
        });
        console.log('Cloudinary connected');
       return cloudinary;
    }
    catch(err){
        console.log(err);
    }
   }



module.exports = cloudinaryConnecte;