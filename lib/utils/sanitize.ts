// Sanitization utilities to prevent XSS
export function sanitizeBio(bio: string): string {
  // Remove HTML tags and dangerous characters
  return bio
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 500) // Enforce max length
}

export function sanitizeUsername(username: string): string {
  // Allow only alphanumeric, spaces, underscores, and hyphens
  return username
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .trim()
    .slice(0, 50)
}
