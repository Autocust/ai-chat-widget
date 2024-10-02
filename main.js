import AIChatWidget from "./AIChatWidget.svelte";

const app = new AIChatWidget({
  target: document.body,
  props: {
    title: "AI Sales Assistant",
    apiUrl:
      "https://workflow.development.tractiontools.it/webhook/cc63b887-5833-40f0-a8d4-dc99648dcc1c/chat",
    brandColor: "#00264c",
    initialMessage: "Ciao, come posso aiutarti?",
    buttonIcon: "💬",
    position: "bottom-right",
  },
});

export default app;
