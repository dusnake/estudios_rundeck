import mongoose from 'mongoose';

const dynatraceSchema = new mongoose.Schema({
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
const dynatrace = mongoose.model('dynatrace', dynatraceSchema);
// Exportar el modelo
export default dynatrace;