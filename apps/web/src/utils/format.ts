import { DisplayUnit } from '@/types';

export const formatCurrency = (value: number, unit: DisplayUnit = 'normal') => {
  let divisor = 1;
  let unitLabel = '';

  switch (unit) {
    case 'ribu':
      divisor = 1000;
      unitLabel = ' Ribu';
      break;
    case 'juta':
      divisor = 1000000;
      unitLabel = ' Juta';
      break;
    case 'milyar':
      divisor = 1000000000;
      unitLabel = ' Milyar';
      break;
    default:
      divisor = 1;
      unitLabel = '';
  }

  const dividedValue = value / divisor;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: unit === 'normal' ? 0 : 2,
    maximumFractionDigits: unit === 'normal' ? 0 : 2,
  }).format(dividedValue) + unitLabel;
};
