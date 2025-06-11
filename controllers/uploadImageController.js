const { imageUploadToCloudinary } = require("../utils/imageUploadToCloudinary");


const handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded.",
            });
        }

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported file type.",
            });
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const url = `data:${req.file.mimetype};base64,${b64}`;

        const result = await imageUploadToCloudinary(url);

        console.log('result',result)

        res.status(200).json({
            success: true,
            message: "Image upload successful.",
            result,
        });
    } catch (err) {
        console.error("Error uploading image:", err.message);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


module.exports = { handleImageUpload };
