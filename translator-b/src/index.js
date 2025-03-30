const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const translationRoutes = require("./routes/translationRoutes")
const historyRoutes = require("./routes/history"); // Import History Route
dotenv.config();


const app = express();
app.use(express.json());

const backendURL = process.env.VITE_BACKEND_URL;

app.use(cors({ origin: backendURL, credentials: true  })); 


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/users", userRoutes);
app.use("/translate", translationRoutes);  // 👈 Translation routes add kiya
app.use("/history", historyRoutes); // Register Route


app.listen(3001, () => console.log("Server running on port 3001 🚀"));
