/**
 * Formats a number into a human-readable abbreviation
 * 
 * @param num - The number to format
 * @returns Formatted string with appropriate suffix (m for million, k for thousand)
 * 
 * @example
 * formatNumber(1000000) // Returns "1.0m"
 * formatNumber(5000) // Returns "5.0k"
 * formatNumber(123) // Returns "123"
 */
export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}m`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
};
