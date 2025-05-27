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
        apiUrl: "https://assistant.aisa.tractiontools.it",
        initialMessage: "Ciao, come posso aiutarti?", // Let component handle default via i18n
        ctaText: "Chiedi informazioni", // Let component handle default via i18n
        buttonIcon: "💬",
        theme: "light", // 'light' or 'dark'
        userMessageBgColor: "#d1eaff", // Light blue
        userMessageTextColor: "#000000",
        assistantMessageBgColor: "#f1f1f1", // Light grey
        assistantMessageTextColor: "#000000",
        userMessageIcon: "https://i.ibb.co/HDy5dkH5/Avatar-generico.png",
        botMessageIcon:
          "https://i.ibb.co/j9d8YgS9/Avatar-generico-Marconio.png",
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
        agentId: "e6730a0c-494e-473f-b680-d94acbb016e6", // Add your development Agent ID here
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
