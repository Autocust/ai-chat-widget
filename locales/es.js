export default {
  widget: {
    title: "Asistente de Ventas AI",
    initialMessage: "Hola, ¿en qué puedo ayudarte?",
    ctaText: "Pide información",
    footerText:
      "Generado por AI. Por favor, verifica la información importante.",
    placeholder: "Escribe un mensaje...",
    placeholderDisabled: "Modo demo - Entrada deshabilitada",
    sendButton: "Enviar",
    resetTitle: "Reiniciar Chat",
    closeTitle: "Cerrar Chat", // Suponiendo que '×' no necesita traducción, pero el título sí
    poweredBy: "Powered by by",
    demoSuffix: "(Demo)",
  },
  status: {
    thinking: "Pensando...",
    searching: "🔍 Buscando...",
    reconnecting: "Reconectando...",
    error: "Ocurrió un error de comunicación.",
    connectionError: "Ocurrió un error de conexión.",
    reconnectFailed:
      "No se pudo restablecer la conexión. Por favor, recarga la página para intentarlo de nuevo.",
    configErrorApi: "Error de Configuración: Falta la URL de la API.",
    sendError: "Ocurrió un error al enviar el mensaje.",
    humanAgentJoined: "Un agente se ha unido al chat.",
    humanAgentLeft: "El agente ha abandonado el chat.",
    assistantBack: 'El asistente está de nuevo en línea.'
  },
  product: {
    buyButton: "Comprar",
  },
  demo: {
    // Textos específicos para el demo si difieren significativamente, de lo contrario reutilizar de 'widget' o 'status'
    initialMessage: "Hola, ¿en qué puedo ayudarte?",
    userMessage: "Estoy buscando zapatillas cómodas para correr.",
    botReply:
      "¡Claro! Tenemos varias opciones. Aquí hay un modelo muy popular conocido por su comodidad y soporte. Puedes ver más detalles aquí:",
    humanAgentReply:
      "¡Hola! Soy un agente humano y me sumo a la conversación. Aquí tienes mis recomendaciones personalizadas y próximos pasos.",
    ctaText: "Ver Zapato XYZ",
  },
};
