import mongoose from 'mongoose';

const rundeckSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        link: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        }
    }
    ,
    {
        timestamps: true,
        versionKey: false,
    }
);
const Rundeck = mongoose.model('Rundeck', rundeckSchema);
// Exportar el modelo
export default Rundeck;