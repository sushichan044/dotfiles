export const extractAllUrls = (text: string): string[] => {
  // g flag just returns all matched parts
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;

  const urls = text.match(urlRegex);

  return urls ? Array.from(new Set(urls)) : [];
};
