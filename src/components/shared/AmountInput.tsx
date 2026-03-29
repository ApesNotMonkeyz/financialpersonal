import * as React from 'react';
import { Input } from '../ui/input';
import { oereToKroner, kronerToOere } from '../../utils/currency';

interface AmountInputProps {
  value: number; // øre
  onChange: (oere: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AmountInput({ value, onChange, placeholder = '0,00', className, disabled }: AmountInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    value > 0 ? oereToKroner(value).toFixed(2).replace('.', ',') : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const oere = kronerToOere(parseFloat(raw.replace(',', '.')) || 0);
    onChange(oere);
  };

  const handleBlur = () => {
    const oere = kronerToOere(parseFloat(displayValue.replace(',', '.')) || 0);
    if (oere > 0) {
      setDisplayValue(oereToKroner(oere).toFixed(2).replace('.', ','));
    } else {
      setDisplayValue('');
    }
  };

  React.useEffect(() => {
    if (value === 0 && displayValue === '') return;
    const currentOere = kronerToOere(parseFloat(displayValue.replace(',', '.')) || 0);
    if (currentOere !== value) {
      setDisplayValue(value > 0 ? oereToKroner(value).toFixed(2).replace('.', ',') : '');
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
        kr
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`pl-9 ${className ?? ''}`}
        disabled={disabled}
      />
    </div>
  );
}
