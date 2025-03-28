import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routerRundeck from "./routes/Rundeck_Route.js";

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://192.168.1.103:27017/rundeck', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// ROUTES
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.use("/api", routerRundeck);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});