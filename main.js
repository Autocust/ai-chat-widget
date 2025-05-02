import AIChatWidget from "./AIChatWidget.svelte";

const app = new AIChatWidget({
  target: document.body,
  props: {
    title: "AI Sales Assistant",
    apiUrl: "http://assistant.tractiontools.local",
    initialMessage: "Ciao, come posso aiutarti?",
    ctaText: "Chiedi informazioni",
    buttonIcon: "💬",
    theme: "light", // 'light' or 'dark'
    userMessageBgColor: "#d1eaff", // Light blue
    userMessageTextColor: "#000000",
    assistantMessageBgColor: "#f1f1f1", // Light grey
    assistantMessageTextColor: "#000000",
    chatButtonBgColor: "#007bff", // Blue
    chatButtonTextColor: "#ffffff",
    ctaButtonBgColor: "#d00", // Light grey (matches assistant bg)
    ctaButtonTextColor: "#fff",
    openInNewTab: false,
    enableUTM: true,
    position: "bottom-right",
    showPoweredBy: true,
    agentId: "cc669ca2-4594-4c3a-beaf-50fe6985e8cb", // Add your development Agent ID here
    cms: "prestashop", // Set to 'prestashop' or other CMS for local testing
    startOpen: true, // Set to true to test the widget starting open
    fullScreen: true, // Set to true to test fullscreen mode
  },
});

export default app;
