import Dynatrace from "../models/Dynatrace_Model.js";

export const ListarDynatrace = async () => {
    try {
        return await Dynatrace.find();
    } catch (error) {
        throw new Error("Error al listar los Dynatraces");
    }
}