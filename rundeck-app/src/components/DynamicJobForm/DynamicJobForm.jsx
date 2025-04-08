import { useState, useEffect } from 'react';
import './DynamicJobForm.css';

/**
 * Componente para renderizar formularios dinámicos para jobs de Rundeck
 */
const DynamicJobForm = ({ 
  jobConfig, 
  initialValues = {}, 
  onChange,
  formValues
}) => {
  // Si no hay configuración, no renderizar nada
  if (!jobConfig || !jobConfig.fields) {
    return (
      <div className="dynamic-job-form-empty">
        Este job no tiene opciones configurables
      </div>
    );
  }

  // Renderizamos los campos según el tipo
  const renderField = (field) => {
    const value = formValues[field.name] !== undefined ? 
                 formValues[field.name] : 
                 field.defaultValue || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={`field-${field.name}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="dynamic-form-input"
          />
        );
        
      case 'textarea':
        return (
          <textarea
            id={`field-${field.name}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="dynamic-form-textarea"
            rows={5}
          />
        );
        
      case 'select':
        return (
          <select
            id={`field-${field.name}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            className="dynamic-form-select"
          >
            <option value="">-- Seleccionar --</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <div className="dynamic-form-checkbox-wrapper">
            <input
              type="checkbox"
              id={`field-${field.name}`}
              checked={value === "true"}
              onChange={(e) => onChange(field.name, e.target.checked ? "true" : "false")}
              className="dynamic-form-checkbox"
            />
            <label htmlFor={`field-${field.name}`} className="dynamic-form-checkbox-label"></label>
          </div>
        );
        
      case 'radio':
        return (
          <div className="dynamic-form-radio-group">
            {field.options?.map(option => (
              <div key={option.value} className="dynamic-form-radio-option">
                <input
                  type="radio"
                  id={`field-${field.name}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className="dynamic-form-radio"
                />
                <label htmlFor={`field-${field.name}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      case 'multiselect':
        // Convertir el valor a array si no lo es
        const selectedValues = Array.isArray(value) ? value : 
                              value ? value.split(',') : [];
                              
        return (
          <div className="dynamic-form-multiselect">
            {field.options?.map(option => (
              <div key={option.value} className="dynamic-form-multiselect-option">
                <input
                  type="checkbox"
                  id={`field-${field.name}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    let newSelected;
                    if (e.target.checked) {
                      newSelected = [...selectedValues, option.value];
                    } else {
                      newSelected = selectedValues.filter(val => val !== option.value);
                    }
                    onChange(field.name, newSelected.join(','));
                  }}
                  className="dynamic-form-multiselect-checkbox"
                />
                <label htmlFor={`field-${field.name}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <input
            type="text"
            id={`field-${field.name}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="dynamic-form-input"
          />
        );
    }
  };

  return (
    <div className="dynamic-job-form">
      {jobConfig.title && (
        <h4 className="dynamic-form-title">{jobConfig.title}</h4>
      )}
      
      {jobConfig.description && (
        <p className="dynamic-form-description">{jobConfig.description}</p>
      )}
      
      <div className="dynamic-form-fields">
        {jobConfig.fields.map(field => (
          <div key={field.name} className="dynamic-form-field">
            <label htmlFor={`field-${field.name}`} className="dynamic-form-label">
              {field.label}
              {field.required && <span className="required-marker">*</span>}
            </label>
            
            {renderField(field)}
            
            {field.description && (
              <div className="dynamic-form-field-description">
                {field.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicJobForm;