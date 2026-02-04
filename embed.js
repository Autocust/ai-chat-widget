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

    // --- Fetch remote configuration ---
    const apiUrl = currentScript ? currentScript.getAttribute("data-api-url") : null;
    const agentId = currentScript ? currentScript.getAttribute("data-agent-id") : "xyz";
    const isDemo = currentScript ? currentScript.getAttribute("data-is-demo") === 'true' : false;

    let apiConfig = {};
    let apiSessionExpiration = null;
    if (!isDemo && apiUrl) {
        try {
            const response = await fetch(`${apiUrl}/preview/${agentId}`);
            if (response.ok) {
                const rawConfig = await response.json();
                if (Object.prototype.hasOwnProperty.call(rawConfig, 'session_expiration')) {
                    apiSessionExpiration = rawConfig.session_expiration;
                }
                // Convert snake_case keys from API to camelCase for component props
                apiConfig = Object.keys(rawConfig).reduce((acc, key) => {
                    const newKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
                    let value = rawConfig[key];

                    if (['fontSize', 'width', 'height'].includes(newKey) && typeof value === 'number') {
                        value = `${value}px`;
                    }

                    acc[newKey] = value;
                    return acc;
                }, {});
            } else {
                console.warn(`Failed to fetch remote config: ${response.status}`);
            }
        } catch (error) {
            console.warn("Error fetching remote config:", error);
        }
    }

    // --- Define defaults and merge with API config ---
    const baseDefaults = {
        title: null,
        apiUrl: null,
        initialMessage: null,
        buttonIcon: "💬",
        buttonImageUrl: null,
        buttonOverlayText: null,
        buttonOverlayDelay: 5000,
        predefinedQuestions: [],
        ctaText: null,
        openInNewTab: true,
        enableUTM: true,
        position: "bottom-right",
        persistentSession: false,
        sessionExpiration: 24,
        theme: "light",
        userMessageIcon: null,
        assistantMessageIcon: null,
        userMessageBgColor: "#e0e0e0",
        userMessageTextColor: "#000000",
        assistantMessageBgColor: "#f8f8f8",
        assistantMessageTextColor: "#000000",
        humanAgentMessageBgColor: "#e0e0e0",
        humanAgentMessageTextColor: "#000000",
        chatButtonBgColor: "#000000",
        chatButtonTextColor: "#ffffff",
        ctaButtonBgColor: "#f8f8f8",
        ctaButtonTextColor: "#000000",
        ctaButtonHoverBgColor: null,
        ctaButtonHoverTextColor: null,
        headerBgColor: null,
        headerTextColor: null,
        footerText: null,
        showPoweredBy: true,
        agentId: "xyz",
        context: null,
        cms: "",
        startOpen: false,
        fullScreen: false,
        width: "340px",
        height: "485px",
        fontSize: "16px",
        zIndex: 1000,
        isDemo: false,
        closable: true,
        customCSS: "",
    };

    // API config overrides base defaults
    const finalDefaults = { ...baseDefaults, ...apiConfig };

    // --- Helper functions to read attributes ---
    function getAttr(name, defaultValue) {
        const value = currentScript ? currentScript.getAttribute(name) : null;
        if (value === null) {
            return defaultValue;
        }
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        return value;
    }

    function getPosition(defaultValue) {
        const position = currentScript ? currentScript.getAttribute('data-position') : null;
        return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position) ? position : defaultValue;
    }

    const HARD_CAP_SESSION_EXPIRATION = 24;

    function parseSessionExpiration(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseFloat(value);
        if (Number.isNaN(parsed) || parsed <= 0) return null;
        return parsed;
    }

    const dataSessionExpirationAttr = currentScript ? currentScript.getAttribute("data-session-expiration") : null;
    const apiSessionExpirationValue = parseSessionExpiration(apiSessionExpiration);
    const dataSessionExpirationValue = parseSessionExpiration(dataSessionExpirationAttr);

    let effectiveSessionExpiration = HARD_CAP_SESSION_EXPIRATION;
    if (apiSessionExpirationValue !== null) {
        effectiveSessionExpiration = Math.min(effectiveSessionExpiration, apiSessionExpirationValue);
    }
    if (dataSessionExpirationValue !== null) {
        effectiveSessionExpiration = Math.min(effectiveSessionExpiration, dataSessionExpirationValue);
    }

    // --- Instantiate the Svelte component ---
    const shadowRoot = targetDiv.attachShadow({ mode: 'open' });
    const chatWidget = new AIChatWidget({
      target: shadowRoot,
      props: {
        // Read data-attributes, falling back to the merged defaults (API > base)
        title: getAttr("data-title", finalDefaults.title),
        apiUrl: getAttr("data-api-url", finalDefaults.apiUrl),
        initialMessage: getAttr("data-initial-message", finalDefaults.initialMessage),
        buttonIcon: getAttr("data-button-icon", finalDefaults.buttonIcon),
        buttonImageUrl: getAttr("data-button-image-url", finalDefaults.buttonImageUrl),
        buttonOverlayText: getAttr("data-button-overlay-text", finalDefaults.buttonOverlayText),
        buttonOverlayDelay: getAttr("data-button-overlay-delay", finalDefaults.buttonOverlayDelay),
        predefinedQuestions: (() => {
            const attr = getAttr("data-predefined-questions", finalDefaults.predefinedQuestions);
            if (typeof attr === 'string') {
                try {
                    const parsed = JSON.parse(attr);
                    return Array.isArray(parsed) ? parsed : finalDefaults.predefinedQuestions;
                } catch (e) {
                    console.warn("Could not parse data-predefined-questions. It should be a valid JSON array string.", e);
                    return finalDefaults.predefinedQuestions;
                }
            }
            return Array.isArray(attr) ? attr : [];
        })(),
        ctaText: getAttr("data-cta-text", finalDefaults.ctaText),
        openInNewTab: getAttr("data-open-in-new-tab", finalDefaults.openInNewTab),
        enableUTM: getAttr("data-enable-utm", finalDefaults.enableUTM),
        position: getPosition(finalDefaults.position),
        persistentSession: getAttr("data-persistent-session", finalDefaults.persistentSession),
        sessionExpiration: effectiveSessionExpiration,
        theme: getAttr("data-theme", finalDefaults.theme),
        userMessageIcon: getAttr("data-user-message-icon", finalDefaults.userMessageIcon),
        assistantMessageIcon: getAttr("data-assistant-message-icon", finalDefaults.assistantMessageIcon),
        humanAgentMessageIcon: getAttr("data-human-agent-message-icon", finalDefaults.humanAgentMessageIcon),
        userMessageBgColor: getAttr("data-user-message-bg-color", finalDefaults.userMessageBgColor),
        userMessageTextColor: getAttr("data-user-message-text-color", finalDefaults.userMessageTextColor),
        assistantMessageBgColor: getAttr("data-assistant-message-bg-color", finalDefaults.assistantMessageBgColor),
        assistantMessageTextColor: getAttr("data-assistant-message-text-color", finalDefaults.assistantMessageTextColor),
        humanAgentMessageBgColor: getAttr("data-human-agent-message-bg-color", finalDefaults.humanAgentMessageBgColor),
        humanAgentMessageTextColor: getAttr("data-human-agent-message-text-color", finalDefaults.humanAgentMessageTextColor),
        chatButtonBgColor: getAttr("data-chat-button-bg-color", finalDefaults.chatButtonBgColor),
        chatButtonTextColor: getAttr("data-chat-button-text-color", finalDefaults.chatButtonTextColor),
        ctaButtonBgColor: getAttr("data-cta-button-bg-color", finalDefaults.ctaButtonBgColor),
        ctaButtonTextColor: getAttr("data-cta-button-text-color", finalDefaults.ctaButtonTextColor),
        ctaButtonHoverBgColor: getAttr("data-cta-button-hover-bg-color", finalDefaults.ctaButtonHoverBgColor),
        ctaButtonHoverTextColor: getAttr("data-cta-button-hover-text-color", finalDefaults.ctaButtonHoverTextColor),
        headerBgColor: getAttr("data-header-bg-color", finalDefaults.headerBgColor),
        headerTextColor: getAttr("data-header-text-color", finalDefaults.headerTextColor),
        footerText: getAttr("data-footer-text", finalDefaults.footerText),
        showPoweredBy: getAttr("data-show-powered-by", finalDefaults.showPoweredBy),
        agentId: getAttr("data-agent-id", finalDefaults.agentId),
        context: getAttr("data-context", finalDefaults.context),
        cms: getAttr("data-cms", finalDefaults.cms),
        startOpen: getAttr("data-start-open", finalDefaults.startOpen),
        fullScreen: getAttr("data-full-screen", finalDefaults.fullScreen),
        width: getAttr("data-width", finalDefaults.width),
        height: getAttr("data-height", finalDefaults.height),
        fontSize: getAttr("data-font-size", finalDefaults.fontSize),
        zIndex: getAttr("data-z-index", finalDefaults.zIndex),
        isDemo: getAttr("data-is-demo", finalDefaults.isDemo),
        closable: getAttr("data-closable", finalDefaults.closable),
        customCSS: getAttr("data-custom-css", finalDefaults.customCSS),
      },
    });

    if (typeof window !== 'undefined') {
      window.autocustChatWidget = {
        open: () => chatWidget?.openChat?.(),
        close: () => chatWidget?.closeChat?.(),
        ask: (question, options) => chatWidget?.askQuestion?.(question, options),
      };
    }
  } catch (error) {
      console.error("Error initializing chat widget:", error);
      // Optionally display an error message to the user
  }
})();
