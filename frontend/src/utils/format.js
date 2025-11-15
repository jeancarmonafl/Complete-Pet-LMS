export function formatRole(role) {
    if (!role)
        return '';
    return role
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
