const express = require("express");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 3001;
const app = express();
app.use(express.json());
const translationRoutes = require("./routes/translationRoutes");

// MongoDB Connect
connectDB();

// Routes

app.use("/api", translationRoutes);

app.use("/api/users", require("./routes/userRoutes"));




app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
