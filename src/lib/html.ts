/**
 * Strip HTML tags and return plain text.
 * Used for AI prompts and text previews where raw content is needed.
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    // Convert <br> and block elements to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    // Convert list items to bullet format
    .replace(/<li[^>]*>/gi, '- ')
    // Strip remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
