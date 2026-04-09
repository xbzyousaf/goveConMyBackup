export const getUserId = (req: any): string | null => {
  return req.session?.userId || null;
};