import mongoose from 'mongoose';
import RundeckExecution from '../models/Rundeck_Exec_Model.js';

/**
 * Actualiza un campo específico en un documento de ejecución
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */


export const updateExecutionField = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { field, value } = req.body;
    
    if (!executionId || !field) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere executionId y field'
      });
    }
    
    // Lista de campos protegidos que no se pueden modificar
    const protectedFields = ['_id', 'executionId', 'createdAt'];
    
    if (protectedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `No se puede modificar el campo protegido: ${field}`
      });
    }
    
    // Crear el objeto de actualización
    const updateObj = {
      [field]: value,
      updatedAt: new Date() // Siempre actualizamos la fecha de modificación
    };
    
    // Realizar la actualización
    const updatedExecution = await RundeckExecution.findOneAndUpdate(
      { executionId },
      { $set: updateObj },
      { new: true } // Devuelve el documento actualizado
    );
    
    if (!updatedExecution) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ejecución con ID: ${executionId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Campo ${field} actualizado correctamente`,
      execution: updatedExecution
    });
    
  } catch (error) {
    console.error('Error al actualizar campo:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar campo',
      error: error.message
    });
  }
};

// Nueva función específica para actualizar el campo cambiochg
export const updateCambioChg = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { valor } = req.body;
    
    if (!executionId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere executionId'
      });
    }
    
    if (valor === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un valor para el campo cambiochg'
      });
    }
    
    // Actualizar el documento con el nuevo campo cambiochg
    const updateObj = {
      cambiochg: valor,
      updatedAt: new Date() // Actualizamos la fecha de modificación
    };
    
    // Realizar la actualización
    const updatedExecution = await RundeckExecution.findOneAndUpdate(
      { executionId },
      { $set: updateObj },
      { new: true } // Devuelve el documento actualizado
    );
    
    if (!updatedExecution) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ejecución con ID: ${executionId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Campo cambiochg actualizado correctamente con valor: ${valor}`,
      execution: updatedExecution
    });
    
  } catch (error) {
    console.error('Error al actualizar campo cambiochg:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar campo cambiochg',
      error: error.message
    });
  }
};