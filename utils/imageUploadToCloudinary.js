const cloudinaryConnecte = require("../config/cloudinaryConnection");

const imageUploadToCloudinary = async (file) => {
    
    try{
        const cloudinary = cloudinaryConnecte();
        const result = await cloudinary.uploader.upload(file, {
            resource_type: "auto",  
        });
        return result;
    }
    catch(err){
        console.log(err);
    }
}

module.exports={imageUploadToCloudinary};