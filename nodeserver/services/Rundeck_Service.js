import Rundeck from "../models/Rundeck_Model.js";

export const ListarRundeck = async () => {
    try {
        return await Rundeck.find();
    } catch (error) {
        throw new Error("Error al listar los rundecks");
    }
}

// export const AddRundeck = async (body) => {
//     try {
//         return await Rundeck.create(body);
//     } catch {
//         return {
//             error: "Error al agregar el rundeck",
//         };
//     }
// }