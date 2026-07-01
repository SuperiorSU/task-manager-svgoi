export const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');