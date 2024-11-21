import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;  // New prop for handling parent state reset
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onClear,  // New prop
  placeholder = "Select an option",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = options.find(opt => opt.value === value);

  // Update search term when value changes
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    }
  }, [value, selectedOption]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected value or empty
        setSearchTerm(selectedOption?.label || "");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleOptionSelect = (option: Option) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");  // Clear the value in parent
    setSearchTerm("");  // Clear the search term
    setIsOpen(false);
    inputRef.current?.focus();
    onClear?.();  // Call the onClear callback if provided
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm(selectedOption?.label || "");
    }
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef} 
      onKeyDown={handleKeyDown}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-2 text-left border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white pr-20 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {searchTerm && !disabled && (
            <X 
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown 
            className="h-4 w-4 text-gray-500"
            onClick={() => !disabled && setIsOpen(!isOpen)}
          />
        </div>
      </div>

      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionSelect(option)}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                option.value === value ? 'bg-gray-50' : ''
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
              {option.value === value && (
                <Check className="h-4 w-4 text-indigo-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;