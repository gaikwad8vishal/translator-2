const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" })); // React Vite


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/api/users", userRoutes);

app.listen(3001, () => console.log("Server running on port 3001 🚀"));
