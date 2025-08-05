import express from "express";
import { connectDB } from "./db/connectDB.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Authentication API",
  });
});

app.use("/auth", authRoutes);

app.listen(3000, () => {
  connectDB();
  console.log("✅Server running on port 3000");
});

// DJ4Z1hfR9s32CqY0
//mongodb+srv://nizhanth23:DJ4Z1hfR9s32CqY0@cluster0.fbwkrxu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// 🟡We need dotenv.config() here to connect db becase we
