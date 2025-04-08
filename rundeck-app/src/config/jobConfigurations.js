/**
 * Configuraciones de formularios para jobs de Rundeck
 * 
 * Este archivo define las opciones personalizadas para diferentes jobs,
 * permitiendo configurar campos específicos basados en el ID o nombre del job.
 */

const JOB_CONFIGURATIONS = {
  // Configuración basada en nombre de job
  "prueba_iaas": {
    title: "Configuración para Prueba IAAS",
    description: "Este job requiere la siguiente información para ejecutarse correctamente",
    fields: [
      {
        name: "version",
        label: "Versión",
        type: "select",
        required: true,
        options: [
          { value: "1.0", label: "Versión 1.0" },
          { value: "1.5", label: "Versión 1.5" },
          { value: "2.0", label: "Versión 2.0 (recomendada)" }
        ],
        defaultValue: "2.0",
        description: "Seleccione la versión del componente a desplegar"
      },
      {
        name: "environment",
        label: "Entorno",
        type: "select",
        required: true,
        options: [
          { value: "dev", label: "Desarrollo" },
          { value: "test", label: "Pruebas" },
          { value: "prod", label: "Producción" }
        ],
        description: "Entorno donde se desplegará la aplicación"
      },
      {
        name: "machines",
        label: "Máquinas",
        type: "textarea",
        required: true,
        placeholder: "Introduce las máquinas (una por línea)",
        description: "Lista de servidores donde se realizará el despliegue"
      },
      {
        name: "enableBackup",
        label: "Realizar backup previo",
        type: "checkbox",
        defaultValue: "true",
        description: "Realiza una copia de seguridad antes de ejecutar el job"
      }
    ],
    validate: (values) => {
      const errors = {};
      
      if (!values.version) {
        errors.version = "La versión es obligatoria";
      }
      
      if (!values.environment) {
        errors.environment = "El entorno es obligatorio";
      }
      
      if (!values.machines) {
        errors.machines = "Debe especificar al menos una máquina";
      }
      
      return errors;
    }
  },
  
  // Configuración basada en ID de job
  "45748491-fa29-4dcd-8ccc-bcb663f210e6": {
    title: "Configuración para Deploy IAAS",
    fields: [
      {
        name: "applicationName",
        label: "Nombre de la aplicación",
        type: "text",
        required: true,
        placeholder: "Ej: myapp-service"
      },
      {
        name: "version",
        label: "Versión a desplegar",
        type: "text",
        required: true,
        placeholder: "Ej: 1.2.3"
      },
      {
        name: "clusters",
        label: "Clusters",
        type: "multiselect",
        options: [
          { value: "cluster1", label: "Cluster Principal" },
          { value: "cluster2", label: "Cluster Secundario" },
          { value: "cluster3", label: "Cluster DR" }
        ],
        defaultValue: ["cluster1"],
        description: "Seleccione los clusters donde se realizará el despliegue"
      },
      {
        name: "rollout",
        label: "Tipo de despliegue",
        type: "radio",
        options: [
          { value: "sequential", label: "Secuencial" },
          { value: "parallel", label: "Paralelo" },
          { value: "canary", label: "Canary (10%)" }
        ],
        defaultValue: "sequential"
      }
    ]
  },
  
  // Configuración predeterminada para jobs que no tienen configuración específica
  "_default_iaas": {
    title: "Configuración para Job IAAS",
    fields: [
      {
        name: "environment",
        label: "Entorno",
        type: "select",
        required: true,
        options: [
          { value: "dev", label: "Desarrollo" },
          { value: "test", label: "Pruebas" },
          { value: "prod", label: "Producción" }
        ]
      },
      {
        name: "machines",
        label: "Máquinas",
        type: "textarea",
        required: true,
        placeholder: "Introduce las máquinas (una por línea)"
      }
    ]
  }
};

/**
 * Obtiene la configuración de un job específico
 * @param {Object} job - El objeto job
 * @returns {Object|null} - Configuración del job o null si no existe
 */
export const getJobConfiguration = (job) => {
  if (!job) return null;
  
  const jobId = job.id || job.jobId;
  const jobName = job.name || job.jobName;
  
  // 1. Buscar por ID exacto
  if (jobId && JOB_CONFIGURATIONS[jobId]) {
    return JOB_CONFIGURATIONS[jobId];
  }
  
  // 2. Buscar por nombre exacto
  if (jobName && JOB_CONFIGURATIONS[jobName]) {
    return JOB_CONFIGURATIONS[jobName];
  }
  
  // 3. Buscar por nombre con coincidencia parcial (para nombres que contengan espacios o varientes)
  if (jobName) {
    for (const configKey in JOB_CONFIGURATIONS) {
      // Omitir claves que empiecen con guión bajo (son configuraciones especiales)
      if (configKey.startsWith('_')) continue;
      
      if (jobName.toLowerCase().includes(configKey.toLowerCase())) {
        return JOB_CONFIGURATIONS[configKey];
      }
    }
  }
  
  // 4. Si el nombre contiene "iaas", usar la configuración predeterminada para IAAS
  if (jobName && jobName.toLowerCase().includes('iaas')) {
    return JOB_CONFIGURATIONS["_default_iaas"];
  }
  
  // 5. No se encontró configuración específica
  return null;
};

export default JOB_CONFIGURATIONS;