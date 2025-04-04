import PropTypes from 'prop-types';
import './ExcelExportButton.css';

export default function ExcelExportButton({ onClick, isDisabled, title }) {
  return (
    <button 
      onClick={onClick} 
      className="export-excel-btn"
      disabled={isDisabled}
      title={title || "Exportar datos a Excel"}
    >
      <svg className="excel-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
      </svg>
      Exportar a Excel
    </button>
  );
}

ExcelExportButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  title: PropTypes.string
};