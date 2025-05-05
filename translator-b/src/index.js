const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const translationRoutes = require("./routes/translationRoutes");
const historyRoutes = require("./routes/history");
const cors = require("cors");
const http = require("http");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin:  "*",
  credentials: true
}));


// MongoDB connectionz
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});


// Routes
app.use("/users", userRoutes);
app.use("/translate", translationRoutes);
app.use("/history", historyRoutes);




const PORT = 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));