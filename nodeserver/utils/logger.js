/**
 * Módulo simple de logging para la aplicación
 */
export const logger = {
    debug: (message, data = null) => {
      if (process.env.NODE_ENV !== 'production') {
        const logObj = data ? { message, data } : message;
        console.debug(`[DEBUG] ${new Date().toISOString()} -`, logObj);
      }
    },
    
    info: (message, data = null) => {
      const logObj = data ? { message, data } : message;
      console.info(`[INFO] ${new Date().toISOString()} -`, logObj);
    },
    
    warn: (message, data = null) => {
      const logObj = data ? { message, data } : message;
      console.warn(`[WARN] ${new Date().toISOString()} -`, logObj);
    },
    
    error: (message, error = null) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
      if (error) {
        if (error instanceof Error) {
          console.error(`Stack: ${error.stack}`);
        } else {
          console.error('Error details:', error);
        }
      }
    }
  };