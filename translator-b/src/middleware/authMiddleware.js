const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access Denied! No Token Provided." });
    }

    const token = authHeader.split(" ")[1]; // "Bearer token_value" se token extract karo

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // User data request mein daal diya
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid Token!" });
    }
};

module.exports = authMiddleware;
