import {
  register,
  init,
  getLocaleFromNavigator,
  locale as currentLocale,
  _,
} from 'svelte-i18n';

// Import locales statically
import en from './locales/en.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import es from './locales/es.js';
import it from './locales/it.js';

const supportedLocales = ['en', 'fr', 'de', 'es', 'it'];

// Register locales using the imported objects
// Wrap in Promise.resolve for potential future compatibility or just pass the object
register('en', () => Promise.resolve(en));
register('fr', () => Promise.resolve(fr));
register('de', () => Promise.resolve(de));
register('es', () => Promise.resolve(es));
register('it', () => Promise.resolve(it));
// Add other languages here if needed

// Function to determine the best initial locale
function determineInitialLocale() {
  const browserLocale = getLocaleFromNavigator(); // Gets primary browser language (e.g., 'en-US')
  if (browserLocale) {
    const languagePart = browserLocale.split('-')[0].toLowerCase(); // Get 'en' from 'en-US'
    if (supportedLocales.includes(languagePart)) {
      return languagePart;
    }
  }
  // More robust check using navigator.languages (optional but recommended)
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      const languagePart = lang.split('-')[0].toLowerCase();
      if (supportedLocales.includes(languagePart)) {
        return languagePart;
      }
    }
  }
  return 'en'; // Fallback
}

// init() is now effectively synchronous because registration functions resolve immediately
const initPromise = init({
  fallbackLocale: 'en',
  initialLocale: determineInitialLocale(),
});

// Keep the promise export for consistency in main.js/embed.js
// It will resolve immediately now.

const setLocale = (newLocale) => {
  if (supportedLocales.includes(newLocale)) {
    currentLocale.set(newLocale);
  } else {
    console.warn(`Locale ${newLocale} is not supported.`);
  }
};

// Export the promise along with other things
export { _, currentLocale, setLocale, initPromise };
