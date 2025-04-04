import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Exporta datos de ejecuciones de Rundeck a un archivo Excel
 * @param {Array} executions - Lista de ejecuciones para exportar
 * @param {Function} formatDate - Función para formatear fechas
 * @returns {Promise<void>}
 */
export const exportExecutionsToExcel = async (executions, formatDate) => {
  // Verificar si hay ejecuciones para exportar
  if (!executions || executions.length === 0) {
    throw new Error("No hay datos para exportar");
  }
  
  // Crear un nuevo workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Rundeck App';
  workbook.lastModifiedBy = 'Rundeck Form';
  
  // Añadir una hoja de trabajo
  const worksheet = workbook.addWorksheet('Ejecuciones Rundeck');
  
  // Definir columnas con estilo
  worksheet.columns = [
    { header: 'ID Ejecución', key: 'id', width: 15 },
    { header: 'Tipo de Cambio', key: 'type', width: 15 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Opciones', key: 'options', width: 25 },
    { header: 'Cant. Máquinas', key: 'machinesCount', width: 15 },
    { header: 'Fecha', key: 'date', width: 20 },
    { header: 'URL', key: 'url', width: 50 }
  ];
  
  // Estilo para el encabezado
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = { 
    type: 'pattern', 
    pattern: 'solid', 
    fgColor: { argb: '2C5898' } 
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Añadir datos
  executions.forEach(execution => {
    // Obtener las opciones específicas
    const specificOptions = execution.options?.specificOptions || execution.specificOptions;
    const formattedOptions = Array.isArray(specificOptions) 
      ? specificOptions.join(', ')
      : specificOptions || 'N/A';
      
    // Contar máquinas
    const machines = execution.options?.machines || execution.machines;
    let machinesCount = 'N/A';
    
    if (typeof machines === 'string') {
      machinesCount = machines.split(/[\n,]+/).filter(m => m.trim() !== '').length;
    } else if (Array.isArray(machines)) {
      machinesCount = machines.length;
    }
    
    // Añadir fila a la hoja
    worksheet.addRow({
      id: execution.executionId,
      type: execution.options?.changeType || execution.changeType || 'N/A',
      status: execution.status || 'Desconocido',
      options: formattedOptions,
      machinesCount: machinesCount,
      date: formatDate(execution.createdAt || execution.startedAt),
      url: execution.permalink || `http://localhost:4440/project/rundeck/execution/show/${execution.executionId}`
    });
  });
  
  // Aplicar estilos a las celdas de estado
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Saltar el encabezado
      const statusCell = row.getCell('status');
      const status = statusCell.value?.toString().toLowerCase();
      
      // Aplicar colores según el estado
      if (status === 'succeeded') {
        statusCell.font = { color: { argb: '008800' } };
      } else if (status === 'failed') {
        statusCell.font = { color: { argb: 'CC0000' } };
      } else if (status === 'running') {
        statusCell.font = { color: { argb: '0066CC' } };
      } else if (status === 'aborted') {
        statusCell.font = { color: { argb: 'FF8800' } };
      }
      
      // Hacer que los URLs sean hipervínculos
      const urlCell = row.getCell('url');
      if (urlCell.value) {
        urlCell.value = {
          text: 'Ver en Rundeck',
          hyperlink: urlCell.value.toString(),
          tooltip: 'Abrir en Rundeck'
        };
        urlCell.font = {
          color: { argb: '0000FF' },
          underline: true
        };
      }
    }
  });
  
  // Generar el archivo y descargarlo
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // formato YYYY-MM-DD
  const fileName = `rundeck_executions_${dateStr}.xlsx`;
  
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
  
  return fileName;
};