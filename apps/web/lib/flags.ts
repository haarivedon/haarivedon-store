/**
 * Build-time feature switches.
 *
 * The blog is now live (admin-managed): public list + article pages, editable
 * from the admin panel. This flag gates the nav entry and the home section.
 */
export const features = {
  blog: true,
} as const;
