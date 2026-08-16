export function flattenObject(obj, prefix = "", result = {}) {
    
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (
            value !== null            && 
            typeof value === "object" && 
            !Array.isArray(value)     && 
            !(value instanceof Date)
        ) {
            flattenObject(value, path, result)
        } else {
            result[path] = value
        }
    }
    return result
}