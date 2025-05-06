import { initPromise } from './i18n.js'; // Import the promise
import AIChatWidget from "./AIChatWidget.svelte";

// Wrap instantiation in an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    await initPromise; // Wait for i18n initialization to complete

    const app = new AIChatWidget({
      target: document.body,
      props: {
        title: "AI Sales Assistant", // Let component handle default via i18n
        apiUrl: "http://assistant.tractiontools.local",
        initialMessage: "Ciao, come posso aiutarti?", // Let component handle default via i18n
        ctaText: "Chiedi informazioni", // Let component handle default via i18n
        buttonIcon: "💬",
        theme: "light", // 'light' or 'dark'
        userMessageBgColor: "#d1eaff", // Light blue
        userMessageTextColor: "#000000",
        assistantMessageBgColor: "#f1f1f1", // Light grey
        assistantMessageTextColor: "#000000",
        chatButtonBgColor: "#007bff", // Blue
        chatButtonTextColor: "#ffffff",
        ctaButtonBgColor: "#d00", // Example override
        ctaButtonTextColor: "#fff", // Example override
        openInNewTab: true,
        enableUTM: true,
        position: "bottom-right",
        persistentSession: true,
        sessionExpiration: 24, // in hours
        showPoweredBy: true,
        agentId: "b06dc179-fa7b-429d-a99e-4e05017abf16", // Add your development Agent ID here
        cms: "", // Set to 'prestashop' or other CMS for local testing
        startOpen: false,
        fullScreen: false,
        isDemo: false,
        closable: true, // Add closable prop for development
        footerText: "",
      },
    });

    // You might not need to export app anymore depending on your setup
    // export default app;
  } catch (error) {
      console.error("Error initializing chat widget:", error);
      // Optionally display an error message to the user on the page
  }
})();
