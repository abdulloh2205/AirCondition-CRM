export const formatMoney = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('ru-RU').format(num) + ' сум';
};

export const formatPhone = (val: string): string => {
  let cleaned = val.replace(/\D/g, '');
  if (cleaned.startsWith('998')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.length === 12 && cleaned.startsWith('998')) {
    cleaned = cleaned.substring(3);
  }

  let formatted = '+998';
  if (cleaned.length > 0) {
    formatted += ' (' + cleaned.substring(0, 2);
  }
  if (cleaned.length >= 3) {
    formatted += ') ' + cleaned.substring(2, 5);
  }
  if (cleaned.length >= 6) {
    formatted += '-' + cleaned.substring(5, 7);
  }
  if (cleaned.length >= 8) {
    formatted += '-' + cleaned.substring(7, 9);
  }
  return formatted;
};

export const cleanPhone = (formatted: string): string => {
  const digits = formatted.replace(/\D/g, '');
  if (!digits.startsWith('998') && digits.length > 0) {
    return '+998' + digits;
  }
  return '+' + digits;
};
