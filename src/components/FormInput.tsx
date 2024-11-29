import React, { ChangeEvent } from "react";
import "./FormInput.css"; // Ensure you have corresponding CSS for styling

// Define an interface for the component props
interface FormInputProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required: boolean;
  errorMessage?: string;
  isValid: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  errorMessage,
  isValid,
}) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  const inputStyle = isValid ? "input valid" : "input invalid";

  return (
    <div className="form-input">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        className={inputStyle}
        placeholder={placeholder}
        required={required}
        aria-describedby={`${name}-error`}
      />
      {!isValid && errorMessage && (
        <span id={`${name}-error`} className="error-message">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default FormInput;
// A reusable form input component with validation styling and error messaging.
