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

// Returns "#anchor" (or "#" when there is no hash) when url points to the current page,
// so clicking it scrolls in place instead of reloading the page (which would close the widget).
export function toSamePageAnchor(url) {
  if (!url || typeof window === 'undefined') return null;
  try {
    const target = new URL(url, window.location.href);
    const current = window.location;
    const samePage = target.origin === current.origin
      && target.pathname.replace(/\/$/, '') === current.pathname.replace(/\/$/, '')
      && target.search === current.search;
    return samePage ? (target.hash || '#') : null;
  } catch (e) {
    return null;
  }
}
