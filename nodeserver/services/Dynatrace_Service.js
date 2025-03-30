import Dynatrace from "../models/Dynatrace_Model.js";

export const ListarDynatrace = async () => {
    try {
        return await Dynatrace.find();
    } catch (error) {
        throw new Error("Error al listar los Dynatraces");
    }
}

export const AddDynatrace = async (body) => {
    try {
        return await Dynatrace.create(body);
    } catch {
        return {
            error: "Error al agregar el Dynatrace",
        };
    }
}