const express = require("express");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.json());

// MongoDB Connect
connectDB();

// Routes
app.use("/api/translate", require("./routes/translationRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});


app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
