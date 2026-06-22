export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? `${str.slice(0, maxLen - 3)}...` : str;

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

export const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
