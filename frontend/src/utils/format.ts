export function formatRole(role?: string | null): string {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
