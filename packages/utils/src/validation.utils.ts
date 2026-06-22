export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^\+?[\d\s-]{10,15}$/.test(phone);

export const passwordStrength = (
  password: string
): { score: number; label: 'weak' | 'fair' | 'strong' | 'very-strong' } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels: ('weak' | 'fair' | 'strong' | 'very-strong')[] = [
    'weak', 'weak', 'fair', 'strong', 'very-strong', 'very-strong',
  ];
  return { score, label: labels[score] ?? 'weak' };
};
