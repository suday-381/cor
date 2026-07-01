import React from 'react';
import { InputNumber, InputNumberProps } from 'antd';

interface CurrencyInputProps extends Omit<InputNumberProps<number>, 'formatter' | 'parser' | 'onChange'> {
  value?: number;
  onChange?: (val: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, ...rest }) => {
  const formatIDR = (val?: number | string) => {
    if (!val) return 'Rp 0';
    return `Rp ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseIDR = (val?: string) => {
    if (!val) return 0;
    return parseInt(val.replace(/\Rp\s?|(\.)/g, ''), 10) || 0;
  };

  const handleChange = (val: number | null) => {
    if (onChange) {
      onChange(val || 0);
    }
  };

  return (
    <InputNumber<number>
      value={value}
      onChange={handleChange}
      formatter={formatIDR}
      parser={parseIDR}
      style={{ width: '100%' }}
      {...rest}
    />
  );
};
