import { initPromise } from './i18n.js'; // Import the promise
import AIChatWidget from "./AIChatWidget.svelte";

// Wrap instantiation in an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    await initPromise; // Wait for i18n initialization to complete

    const app = new AIChatWidget({
      target: document.body,
      props: {
        // Props remain the same, but remove defaults for translatable text
        // title: "AI Sales Assistant", // Let component handle default via i18n
        apiUrl: "http://assistant.tractiontools.local",
        // initialMessage: "Ciao, come posso aiutarti?", // Let component handle default via i18n
        // ctaText: "Chiedi informazioni", // Let component handle default via i18n
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
        openInNewTab: false,
        enableUTM: true,
        position: "bottom-right",
        showPoweredBy: true,
        agentId: "cc669ca2-4594-4c3a-beaf-50fe6985e8cb", // Add your development Agent ID here
        cms: "prestashop", // Set to 'prestashop' or other CMS for local testing
        startOpen: false,
        fullScreen: false,
        isDemo: false,
        closable: true, // Add closable prop for development
        // footerText: "", // Let component handle default via i18n
      },
    });

    // You might not need to export app anymore depending on your setup
    // export default app;
  } catch (error) {
      console.error("Error initializing chat widget:", error);
      // Optionally display an error message to the user on the page
  }
})();
