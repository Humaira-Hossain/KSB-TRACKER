// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(express.json());

// console.log("URI:", process.env.MONGODB_URI);

// mongoose
//   .connect(process.env.MONGODB_URI, {
//     serverSelectionTimeoutMS: 10000,
//   })
//   .then(() => {
//     console.log("Connected to MongoDB");

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("MongoDB connection failed:", error);
//   });

// app.get("/api/health", (req, res) => {
//   res.json({ message: "API is working" });
// });