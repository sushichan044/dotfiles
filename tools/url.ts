export function isRawContentURL(url: URL): boolean {
  if (
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "gist.githubusercontent.com"
  ) {
    return true;
  }

  return false;
}
