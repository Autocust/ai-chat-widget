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
        // buttonImageUrl: "https://i.ibb.co/wNfKVh30/Marconio-Risponde.png",
        buttonOverlayText: "Hai una domanda? Chiedi a me!",
        buttonOverlayDelay: 5000,
        predefinedQuestions: [
          "What are your shipping times?",
          "Do you have any discounts?",
          "Tell me about your return policy",
          "Where are you located?",
        ],
        theme: "light", // 'light' or 'dark'
        userMessageBgColor: "#d1eaff", // Light blue
        userMessageTextColor: "#000",
        assistantMessageBgColor: "#f1f1f1", // Light grey
        assistantMessageTextColor: "#000",
        humanAgentMessageBgColor: "#00529b", // Light grey
        humanAgentMessageTextColor: "#fff",
        userMessageIcon: "https://i.ibb.co/HDy5dkH5/Avatar-generico.png",
        assistantMessageIcon:
          "https://static.aisa.tractiontools.it/1763143514193-ChatGPT%20Image%2014%20nov%202025,%2019_03_17.png",
        humanAgentMessageIcon:
          "https://i.ibb.co/j9d8YgS9/Avatar-generico-Marconio.png",
        chatButtonBgColor: "#007bff", // Blue
        chatButtonTextColor: "#ffffff",
        ctaButtonBgColor: "#d00", // Example override
        ctaButtonTextColor: "#fff", // Example override
        ctaButtonHoverBgColor: "#ff4d4d", // Example hover override
        ctaButtonHoverTextColor: "#000", // Example hover override
        headerBgColor: "#00529b", // Example custom header bg
        headerTextColor: "#ffffff", // Example custom header text
        openInNewTab: true,
        enableUTM: true,
        position: "bottom-right",
        persistentSession: true,
        sessionExpiration: 24, // in hours
        showPoweredBy: true,
        agentId: "1da03dfa-2516-4d84-ad7a-99468403c654", // Add your development Agent ID here
        cms: "", // Set to 'prestashop' or other CMS for local testing
        startOpen: false,
        fullScreen: false,
        width: "340px",
        height: "485px",
        fontSize: "16px",
        isDemo: true,
        closable: true, // Add closable prop for development
        zIndex: 1001,
        footerText: "Controlla le info importanti",
        context: {
          fullName: "Mario Rossi",
          email: "mario.rossi@gmail.com",
          persID: "66630",
          stuIDs: ["88529", "115554"],
          matIDs: ["93089", "121764"],
          cdsIDs: ["10026", "10673"],
          departmentIDs: ["10055", "10055"],
          adIDs: [
            "1723",
            "4242",
            "5063",
            "5064",
            "5065",
            "5066",
            "5067",
            "5068",
            "5069",
            "5070",
          ],
          academicYear: "2025",
        },
      },
    });
  } catch (error) {
    console.error("Error initializing chat widget:", error);
  }
})();
