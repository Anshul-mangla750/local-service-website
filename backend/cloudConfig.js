if(process.env.NODE_ENV!= "production"){
  require('dotenv').config();
}

console.log("Cloudinary ENV variables:", {
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUD_API_KEY: process.env.KEY,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
});

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
   cloud_name:process.env.CLOUD_NAME,
   api_key:process.env.KEY,
   api_secret:process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servicehub_DEV',
    allowedFormats: ["png","jpg","jpeg"],// supports promises as well
    
  },
});

module.exports = {
    cloudinary,storage
}
