import { ListarRundeck } from "../services/Rundeck_Service.js";

export const ListarRundeckController = async (req, res) => {
    try {
        const rundecks = await ListarRundeck();
        res.status(200).json(rundecks);
    } 
    catch {
        res.status(404).json({ error: "Error al listar los rundecks"});
    }
}

