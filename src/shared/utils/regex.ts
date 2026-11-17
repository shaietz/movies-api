/** Escapes user input for safe use inside a RegExp (prevents regex injection / ReDoS). */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
