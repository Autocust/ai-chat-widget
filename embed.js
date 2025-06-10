import { initPromise } from './i18n.js'; // Import the promise
import AIChatWidget from "./AIChatWidget.svelte";

// Wrap instantiation in an async IIFE
(async () => {
  try {
    await initPromise; // Wait for i18n initialization to complete

    // Create a new div element to host our Svelte component
    const targetDiv = document.createElement("div");

    // Get the current script tag
    const currentScript = document.currentScript;

    // Insert the new div before the script tag
    if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(targetDiv, currentScript);
    } else {
        // Fallback if script tag isn't found (e.g., async loading issues)
        console.warn("Could not find current script tag to insert widget. Appending to body.");
        document.body.appendChild(targetDiv);
    }


    // Function to get attribute value with a default
    function getAttr(name, defaultValue) {
        // Ensure currentScript exists before trying to access attributes
        const value = currentScript ? currentScript.getAttribute(name) : null;
        if (value === null) {
            return defaultValue;
        }
        // Convert "true" and "false" strings to boolean
        if (value.toLowerCase() === 'true') {
            return true;
        } else if (value.toLowerCase() === 'false') {
            return false;
        }
        return value; // Return the value as is if it's not a boolean string or null
    }

    // Function to get position with a default
    function getPosition(defaultValue) {
        const position = currentScript ? currentScript.getAttribute('data-position') : null;
        return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position) ? position : defaultValue;
    }

    // Instantiate the Svelte component
    const chatWidget = new AIChatWidget({
      target: targetDiv,
      props: {
        // Remove default values for translatable strings - let the component handle them via i18n
        title: getAttr("data-title", null),
        apiUrl: getAttr("data-api-url", null), // Keep null or default URL if applicable
        initialMessage: getAttr("data-initial-message", null),
        buttonIcon: getAttr("data-button-icon", "💬"), // Keep non-translatable defaults
        buttonImageUrl: getAttr("data-button-image-url", null),
        buttonOverlayText: getAttr("data-button-overlay-text", null),
        buttonOverlayDelay: getAttr("data-button-overlay-delay", 5000),
        quickMessages: (() => {
            const attr = getAttr("data-quick-messages", "[]");
            try {
                const parsed = JSON.parse(attr);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.warn("Could not parse data-quick-messages. It should be a valid JSON array string.", e);
                return [];
            }
        })(),
        ctaText: getAttr("data-cta-text", null),
        openInNewTab: getAttr("data-open-in-new-tab", true),
        enableUTM: getAttr("data-enable-utm", true),
        position: getPosition("bottom-right"),
        persistentSession: getAttr("data-persistent-session", false),
        sessionExpiration: getAttr("data-session-expiration", 24),
        theme: getAttr("data-theme", "light"),
        userMessageIcon: getAttr("data-user-message-icon", null),
        botMessageIcon: getAttr("data-bot-message-icon", null),
        userMessageBgColor: getAttr("data-user-message-bg-color", "#e0e0e0"),
        userMessageTextColor: getAttr(
          "data-user-message-text-color",
          "#000000"
        ),
        assistantMessageBgColor: getAttr(
          "data-assistant-message-bg-color",
          "#f8f8f8"
        ),
        assistantMessageTextColor: getAttr(
          "data-assistant-message-text-color",
          "#000000"
        ),
        chatButtonBgColor: getAttr("data-chat-button-bg-color", "#000000"),
        chatButtonTextColor: getAttr("data-chat-button-text-color", "#ffffff"),
        ctaButtonBgColor: getAttr("data-cta-button-bg-color", "#f8f8f8"),
        ctaButtonTextColor: getAttr("data-cta-button-text-color", "#000000"),
        ctaButtonHoverBgColor: getAttr("data-cta-button-hover-bg-color", null),
        ctaButtonHoverTextColor: getAttr("data-cta-button-hover-text-color", null),
        headerBgColor: getAttr("data-header-bg-color", null),
        headerTextColor: getAttr("data-header-text-color", null),
        footerText: getAttr("data-footer-text", null),
        showPoweredBy: getAttr("data-show-powered-by", true),
        agentId: getAttr("data-agent-id", "xyz"),
        cms: getAttr("data-cms", ""),
        startOpen: getAttr("data-start-open", false),
        fullScreen: getAttr("data-full-screen", false),
        width: getAttr("data-width", "340px"),
        height: getAttr("data-height", "485px"),
        isDemo: getAttr("data-is-demo", false),
        closable: getAttr("data-closable", true),
      },
    });
  } catch (error) {
      console.error("Error initializing chat widget:", error);
      // Optionally display an error message to the user
  }
})();
