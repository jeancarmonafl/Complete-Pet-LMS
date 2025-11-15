export function buildEmployeeId(latestNumericId) {
    return `EMP${`${latestNumericId}`.padStart(3, '0')}`;
}
export function buildLoginIdentifier(fullName, employeeId, email) {
    if (email && email.trim().length > 0) {
        return email.toLowerCase();
    }
    // Generate auto-generated company email: IIEMPXXX@complete-pet.com
    // II = first initial of first name + first initial of last name
    const names = fullName.trim().split(/\s+/);
    let initials = '';
    if (names.length >= 2) {
        // Take first letter of first name and first letter of last name
        initials = (names[0][0] || '') + (names[names.length - 1][0] || '');
    }
    else if (names.length === 1) {
        // If only one name, use first two letters
        initials = (names[0][0] || '') + (names[0][1] || 'X');
    }
    else {
        initials = 'CP';
    }
    return `${initials.toUpperCase()}${employeeId}@complete-pet.com`.toLowerCase();
}
