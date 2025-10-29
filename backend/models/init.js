const mongoose = require("mongoose");

const Service = require("./browse.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/servicehub";
// Connect to MongoDB
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connection successful");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
main();
const data =[
  {
    title: "Electrician for Home Repairs",
    description: "Fix wiring issues, install ceiling fans, and other electrical work.",
    price: 500,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1661911309991-cc81afcce97d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Rohtak",
    category: "Home Repair",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Plumber for Leak Repair",
    description: "Quick and reliable service for taps, pipes, and drainage systems.",
    price: 300,
    image: {
      url: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Panipat",
    category: "Home Repair",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Home Cleaning Service",
    description: "Deep cleaning of rooms, kitchen, and bathrooms.",
    price: 1200,
    image: {
      url: "https://images.unsplash.com/photo-1581578949510-fa7315c4c350?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Sonipat",
    category: "Cleaning",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "AC Service and Gas Refill",
    description: "Complete AC maintenance, repair, and cooling issues fixed.",
    price: 800,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1683134512538-7b390d0adc9e?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Hisar",
    category: "Appliance Repair",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Tailor - Blouse & Suit Stitching",
    description: "Custom tailoring for ladies' suits and blouses with fitting guarantee.",
    price: 400,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1676586308760-e6491557432f?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Bhiwani",
    category: "Tailoring",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Mobile Repair at Home",
    description: "Get your smartphone repaired at your doorstep by expert technicians.",
    price: 350,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1663045633178-69156beda8d8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Karnal",
    category: "Electronics Repair",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Car Wash and Detailing",
    description: "Full exterior and interior car wash with polish.",
    price: 700,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1661501041641-3e731115e687?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Yamunanagar",
    category: "Automotive",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "CCTV Installation",
    description: "Secure your home or shop with a 4-camera CCTV setup.",
    price: 4500,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1675016457613-2291390d1bf6?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Jhajjar",
    category: "Security",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Home Tutor - Class 10 Math",
    description: "Experienced tutor for CBSE Math syllabus at home.",
    price: 600,
    image: {
      url: "https://plus.unsplash.com/premium_photo-1691708773629-94aeedf48627?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Faridabad",
    category: "Education",
    owner:'687afef193da4894664c5102'
  },
  {
    title: "Gardening and Lawn Service",
    description: "Seasonal planting, trimming, and landscaping for home gardens.",
    price: 900,
    image: {
      url: "https://images.unsplash.com/photo-1621460248083-6271cc4437a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      filename: "service-hub.jpg"
    },
    location: "Rewari",
    category: "Gardening",
    owner:'687afef193da4894664c5102'
  }
];





const initDB = async ()=>{
   await Service.deleteMany({});
   await Service.insertMany(data);
   console.log("data was initialized");
}
// initDB();
module.exports = {main};

