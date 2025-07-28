export function addUtmParams(url, source, medium, campaign, enableUTM = true) {
  if (!enableUTM || !url || url.startsWith('#')) return url;
  try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('utm_source', source);
      urlObj.searchParams.set('utm_medium', medium);
      urlObj.searchParams.set('utm_campaign', campaign);
      return urlObj.toString();
  } catch (e) {
      console.warn("Could not add UTM params to invalid URL:", url, e);
      return url;
  }
}