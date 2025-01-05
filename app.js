import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import postRoute from "./routes/post.route.js";
import authRoute from "./routes/auth.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config();

const app = express();


const cors = require('cors');
app.use(cors()); // Add this line

// Middleware
const allowedOrigins = ['https://real-estate-mernstack.netlify.app'];

app.use(cors({
  origin: allowedOrigins, // Allow only your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials if needed
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/test", testRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

// Health Check Endpoint
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
});

// Server Listener
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});
