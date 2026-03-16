export const truncateText = (text?: string, limit = 75): string => {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit) + "..." : text;
};
export const getFirstLetter = (name?: string | null, fallback = "U"): string => {
  return name?.charAt(0)?.toUpperCase() ?? fallback;
};