/**
 * Configuraciones predefinidas para jobs específicos
 * Cada configuración contiene:
 * - fields: campos que se mostrarán en el formulario
 * - defaults: valores por defecto para los campos
 * - validate: función para validar los campos antes de enviar
 */
export const JOB_CONFIGURATIONS = {
    // Configuración para el job "prueba_iaas"
    "prueba_iaas": {
      title: "Configuración de prueba IAAS",
      fields: [
        {
            name: "characterName",
            label: "characterName",
            type: "textarea",
            required: true,
            description: "Ingresa cada nombre de máquina en una línea separada"
        },
        {
            name: "mierdaseca",
            label: "mierdaseca",
            type: "textarea",
            required: true,
            description: "Ingresa mierdaseca"
        },
        // {
        //   name: "machines",
        //   label: "Máquinas",
        //   type: "textarea",
        //   required: true,
        //   description: "Ingresa cada nombre de máquina en una línea separada"
        // },
        // {
        //   name: "nodeManager",
        //   label: "Configurar como Nodo Manager",
        //   type: "checkbox",
        //   default: "false"
        // },
        // {
        //   name: "httpPort",
        //   label: "Puerto HTTP",
        //   type: "number",
        //   default: "9080",
        //   min: 1024,
        //   max: 65535
        // },
        // {
        //   name: "httpsPort",
        //   label: "Puerto HTTPS",
        //   type: "number",
        //   default: "9443",
        //   min: 1024,
        //   max: 65535
        // },
        // {
        //   name: "notes",
        //   label: "Notas adicionales",
        //   type: "textarea",
        //   description: "Información adicional para los ejecutores del job"
        // }
      ],
      validate: (options) => {
        const errors = [];
        
        // if (!options.version || options.version.trim() === '') {
        //   errors.push("Debe seleccionar una versión");
        // }
        
        // if (!options.environment || options.environment.trim() === '') {
        //   errors.push("Debe seleccionar un entorno");
        // }
        
        // if (!options.machines || options.machines.trim() === '') {
        //   errors.push("Debe ingresar al menos una máquina");
        // }
        
        return errors;
      }
    },
    
    // Configuración genérica por defecto para cualquier job con "iaas" en el nombre
    "_default_iaas": {
      title: "Configuración de IAAS",
      fields: [
        {
          name: "clustername",
          label: "Nombre del clúster",
          type: "text",
          required: true
        },
        {
          name: "servername",
          label: "Nombre del servidor",
          type: "text",
          required: true
        },
        {
          name: "environment",
          label: "Entorno",
          type: "select",
          required: true,
          options: [
            { value: "development", label: "Desarrollo" },
            { value: "testing", label: "Pruebas" },
            { value: "production", label: "Producción" }
          ]
        }
      ],
      validate: (options) => {
        const errors = [];
        
        if (!options.clustername || options.clustername.trim() === '') {
          errors.push("Debe especificar un nombre de clúster");
        }
        
        if (!options.servername || options.servername.trim() === '') {
          errors.push("Debe especificar un nombre de servidor");
        }
        
        if (!options.environment || options.environment.trim() === '') {
          errors.push("Debe seleccionar un entorno");
        }
        
        return errors;
      }
    }
  };
  
  /**
   * Obtiene la configuración para un job específico
   * @param {string} jobName - Nombre del job
   * @returns {Object} Configuración del job o la configuración por defecto
   */
  export function getJobConfiguration(jobName) {
    if (!jobName) return null;
    
    // Primero intentamos encontrar una configuración específica para el nombre exacto
    if (JOB_CONFIGURATIONS[jobName]) {
      return JOB_CONFIGURATIONS[jobName];
    }
    
    // Si no hay configuración específica pero contiene "iaas", usamos la configuración por defecto
    if (jobName.toLowerCase().includes('iaas')) {
      return JOB_CONFIGURATIONS["_default_iaas"];
    }
    
    // Si no hay configuración para este job
    return null;
  }