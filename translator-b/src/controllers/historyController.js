const History = require("../models/History");
const csv = require("fast-csv"); // For CSV generation
const { Readable } = require("stream"); // To stream the CSV data

// Save history
exports.saveHistory = async (req, res) => {
  try {
    const { input, translation, from, to } = req.body;
    const userId = req.user.id; // Assuming you're using authentication middleware

    if (!input || !translation || !from || !to) {
      return res.status(400).json({ error: "Missing data" });
    }

    const historyEntry = new History({ userId, input, translation, from, to });
    await historyEntry.save();

    res.json({ message: "History saved successfully" });
  } catch (error) {
    console.error("Error saving history:", error);
    res.status(500).json({ error: "Error saving history" });
  }
};

// Fetch history with date range filtering
exports.FetchHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from token
    const { startDate, endDate } = req.query; // Get date range from query params

    // Build query object
    const query = { userId };

    // Add date range filtering if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate); // Greater than or equal to startDate
      }
      if (endDate) {
        // Set endDate to the end of the day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day
        query.createdAt.$lte = end; // Less than or equal to endDate
      }
    }

    const history = await History.find(query).sort({ createdAt: -1 }); // Get history sorted by latest

    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// Delete history item
exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params; // History item ID from params
    const userId = req.user.id; // Logged-in user ID

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

// Toggle favorite status
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params; // History item ID from params
    const userId = req.user.id; // Logged-in user ID
    const { favorite } = req.body; // New favorite status (true/false)

    if (typeof favorite !== "boolean") {
      return res.status(400).json({ error: "Favorite status must be a boolean" });
    }

    const historyItem = await History.findOne({ _id: id, userId });
    if (!historyItem) {
      return res.status(404).json({ error: "History item not found" });
    }

    historyItem.favorite = favorite;
    await historyItem.save();

    res.json({ message: "Favorite status updated successfully", historyItem });
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    res.status(500).json({ error: "Failed to update favorite status" });
  }
};

// Export history as CSV
exports.exportHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user ID
    const history = await History.find({ userId }).sort({ createdAt: -1 });

    if (!history.length) {
      return res.status(404).json({ error: "No history found to export" });
    }

    // Prepare data for CSV
    const csvData = history.map((item) => ({
      input: item.input,
      translation: item.translation,
      from: item.from,
      to: item.to,
      createdAt: new Date(item.createdAt).toISOString(),
      favorite: item.favorite ? "Yes" : "No",
    }));

    // Set response headers for CSV download **before** sending the response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="translation_history_${new Date().toISOString()}.csv"`
    );

    // Create a readable stream for the CSV data
    const csvStream = csv.format({ headers: true });
    const readableStream = new Readable({
      read() {
        // Push each row of data into the stream
        csvData.forEach((row) => this.push(JSON.stringify(row) + "\n"));
        this.push(null); // End the stream after all data is pushed
      },
    });

    // Pipe the data to the CSV stream and then to the response
    readableStream
      .pipe(csvStream)
      .pipe(res, { end: true });

    // Handle stream errors to prevent uncaught exceptions
    csvStream.on("error", (error) => {
      console.error("CSV stream error:", error);
      // If the response hasn't been sent yet, send an error response
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export history" });
      }
    });

    readableStream.on("error", (error) => {
      console.error("Readable stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export history" });
      }
    });
  } catch (error) {
    console.error("Error exporting history:", error);
    // Only send an error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export history" });
    }
  }
};