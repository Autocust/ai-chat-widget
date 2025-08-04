export default {
  widget: {
    title: "KI-Verkaufsassistent",
    initialMessage: "Hallo, wie kann ich Ihnen helfen?",
    ctaText: "Informationen anfordern",
    footerText:
      "Generiert von KI. Bitte überprüfen Sie wichtige Informationen.",
    placeholder: "Schreiben Sie eine Nachricht...",
    placeholderDisabled: "Demo-Modus - Eingabe deaktiviert",
    sendButton: "Senden",
    resetTitle: "Chat zurücksetzen",
    closeTitle: "Chat schließen", // Angenommen, '×' muss nicht übersetzt werden, aber der Titel könnte
    poweredBy: "Poweredy by",
    demoSuffix: "(Demo)",
  },
  status: {
    thinking: "Denken...",
    searching: "🔍 Suche...",
    reconnecting: "Wiederverbinden...",
    error: "Ein Kommunikationsfehler ist aufgetreten.",
    connectionError: "Ein Verbindungsfehler ist aufgetreten.",
    reconnectFailed:
      "Die Verbindung konnte nicht wiederhergestellt werden. Bitte laden Sie die Seite neu, um es erneut zu versuchen.",
    configErrorApi: "Konfigurationsfehler: Fehlende API-URL.",
    sendError: "Beim Senden der Nachricht ist ein Fehler aufgetreten.",
    humanAgentJoined: "Ein Agent ist dem Chat beigetreten.",
    humanAgentLeft: "Der Agent hat den Chat verlassen.",
    assistantBack: 'Der Assistent ist wieder online.'
  },
  product: {
    buyButton: "Kaufen",
  },
  demo: {
    // Demo-spezifische Texte, falls sie sich erheblich unterscheiden, ansonsten Wiederverwendung aus 'widget' oder 'status'
    initialMessage: "Hallo, wie kann ich Ihnen helfen?",
    userMessage: "Ich suche bequeme Laufschuhe.",
    botReply:
      "Natürlich! Wir haben mehrere Optionen. Hier ist ein sehr beliebtes Modell, das für seinen Komfort und seine Unterstützung bekannt ist. Weitere Details finden Sie hier:",
    ctaText: "Schuh XYZ ansehen",
  },
};
