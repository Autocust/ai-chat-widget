import AIChatWidget from "./AIChatWidget.svelte";

// Create a new div element to host our Svelte component
const targetDiv = document.createElement("div");

// Get the current script tag
const currentScript = document.currentScript;

// Insert the new div before the script tag
currentScript.parentNode.insertBefore(targetDiv, currentScript);

// Function to get attribute value with a default
function getAttr(name, defaultValue) {
    const value = currentScript.getAttribute(name);
    if (value === null) {
        return defaultValue;
    }
    // Convert "true" and "false" strings to boolean
    if (value.toLowerCase() === 'true') {
        return true;
    } else if (value.toLowerCase() === 'false') {
        return false;
    }
    return value; // Return the value as is if it's not a boolean string
}

// Function to get position with a default
function getPosition(defaultValue) {
    const position = currentScript.getAttribute('data-position');
    return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position) ? position : defaultValue;
}

// Instantiate the Svelte component
const chatWidget = new AIChatWidget({
  target: targetDiv,
  props: {
    title: getAttr("data-title", "AI Sales Assistant"),
    apiUrl: getAttr("data-api-url", "https://your-default-api-url.com"),
    brandColor: getAttr("data-brand-color", "#00264c"),
    initialMessage: getAttr(
      "data-initial-message",
      "Ciao, come posso aiutarti?"
    ),
    buttonIcon: getAttr("data-button-icon", "💬"),
    ctaText: getAttr("data-cta-text", "Chiedi informazioni"),
    openInNewTab: getAttr("data-open-in-new-tab", true),
    enableUTM: getAttr("data-enable-utm", true),
    position: getPosition("bottom-right"),
    persistentSession: getAttr("data-persistent-session", false),
    sessionExpiration: getAttr("data-session-expiration", 24)
  },
});
