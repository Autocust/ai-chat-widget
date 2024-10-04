import AIChatWidget from "./AIChatWidget.svelte";

const app = new AIChatWidget({
  target: document.body,
  props: {
    title: "AI Sales Assistant",
    apiUrl:
      "http://localhost:7860/api/v1/run/e3199283-447e-487c-a3d2-cd1bff638bfd?stream=false",
    brandColor: "#00264c",
    initialMessage: "Ciao, come posso aiutarti?",
    buttonIcon: "💬",
    position: "bottom-right",
  },
});

export default app;
