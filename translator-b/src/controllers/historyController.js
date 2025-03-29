const History = require("../models/History");

exports.saveHistory = async (req, res) => {
  try {

    const { input, translation,from ,to } = req.body;
    const userId = req.user.id; // Assuming you're using authentication middleware

    if (!input || !translation) {
      return res.status(400).json({ error: "Missing data" });
    }

    const historyEntry = new History({ userId, input, translation , from, to});
    await historyEntry.save();

    res.json({ message: "History saved successfully" });
  } catch (error) { 
    console.error("Error saving history:", error);
    res.status(500).json({ error: "Error saving history" });
  }
};


exports.FetchHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token
        const history = await History.find({ userId }).sort({ createdAt: -1 }); // Get history sorted by latest

        res.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
}



exports.deleteHistory = async (req, res) => {
    try {
      const { id } = req.params; // ✅ Frontend se ID aayegi
      const userId = req.user.id; // ✅ Logged-in user ka ID
  
      const historyItem = await History.findOne({ _id: id, userId });
      if (!historyItem) {
        return res.status(404).json({ error: "History item not found" });
      }
  
      await History.deleteOne({ _id: id });
      res.json({ message: "History deleted successfully" });
  
    } catch (error) {
      console.error("Error deleting history:", error);
      res.status(500).json({ error: "Failed to delete history" });
    }
  };
  