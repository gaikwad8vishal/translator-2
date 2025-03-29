const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    input: { type: String, required: true },
    translation: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("History", historySchema);
