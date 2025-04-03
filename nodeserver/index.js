import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import routerRundeck from "./routes/Rundeck_Route.js";
import routerDynatrace from "./routes/Dynatrace_Route.js";
import routerRundeckApi from "./routes/RundeckApi_Route.js";
import routerAuth from "./routes/Auth_Route.js"; 
import routerDragonBall from "./routes/DragonBall_Route.js";
import routerRundeckForm from "./routes/RundeckForm_Route.js";
import { startUpdateService } from "./services/RundeckCronApi_Service.js";


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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
    
    // Iniciar el servicio de actualización periódica
    const updateTask = startUpdateService();
    
    // Opcional: Manejar cierre de la aplicación para detener las tareas
    process.on('SIGINT', () => {
        console.log('Cerrando aplicación...');
        if (updateTask) updateTask.stop();
        db.close(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// ROUTES
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.use("/api", routerRundeck);
app.use("/api", routerDynatrace);
app.use("/api", routerRundeckApi);
app.use("/api", routerAuth); // Authldap
app.use("/api", routerDragonBall);
app.use("/api", routerRundeckForm); // Nueva ruta de Dragon Ball


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});