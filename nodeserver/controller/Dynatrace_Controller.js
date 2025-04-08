import { ListarDynatrace } from "../services/Dynatrace_Service.js";

export const ListarDynatraceController = async (req, res) => {
    try {
        const Dynatraces = await ListarDynatrace();
        res.status(200).json(Dynatraces);
    } 
    catch {
        res.status(404).json({ error: "Error al listar los Dynatraces"});
    }
}

// export const AddDynatraceController = async (req, res) => {
//     try {
//         const Dynatrace = await AddDynatrace(req.body);
//         res.status(200).json(Dynatrace);
//     } 
//     catch{
//         res.status(404).json({error: "Error al agregar el Dynatrace"});
//     }
// }
