const multer = require("multer");

const storage = new multer.memoryStorage();
    const multerUpload = multer({ storage });
module.exports = multerUpload;