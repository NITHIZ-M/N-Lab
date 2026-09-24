import React from 'react';

interface Option {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onChange,
}) => {
  return (
    <div className="segmented-control">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`segmented-option ${selectedValue === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};
