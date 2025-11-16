export default {
  widget: {
    title: 'Assistente Vendite AI',
    initialMessage: 'Ciao, come posso aiutarti?',
    ctaText: 'Chiedi informazioni',
    footerText: 'Generato da AI. Verifica le informazioni importanti.',
    placeholder: 'Scrivi un messaggio...',
    placeholderDisabled: 'Modalità demo - Input disabilitato',
    sendButton: 'Invia',
    resetTitle: 'Reimposta Chat',
    closeTitle: 'Chiudi Chat', // Supponendo che '×' non necessiti traduzione, ma il titolo potrebbe
    poweredBy: 'Poweredy by',
    demoSuffix: '(Demo)',
  },
  status: {
    thinking: 'Sto pensando...',
    searching: '🔍 Cerco...',
    reconnecting: 'Riconnessione in corso...',
    error: 'Si è verificato un errore di comunicazione.',
    connectionError: 'Si è verificato un errore di connessione.',
    reconnectFailed:
      'Impossibile ristabilire la connessione. Ricarica la pagina per riprovare.',
    configErrorApi: 'Errore di configurazione: URL API mancante.',
    sendError: "Si è verificato un errore durante l'invio del messaggio.",
    humanAgentJoined: "Un agente si è unito alla conversazione.",
    humanAgentLeft: "L'agente ha lasciato la conversazione.",
    assistantBack: "L'assistente AI è di nuovo online."
  },
  product: {
    buyButton: 'Acquista',
  },
  demo: {
    // Testi specifici per la demo se differiscono significativamente, altrimenti riutilizza da 'widget' o 'status'
    initialMessage: 'Ciao, come posso aiutarti?',
    userMessage: 'Sto cercando scarpe da corsa comode.',
    botReply: 'Certamente! Abbiamo diverse opzioni. Ecco un modello molto popolare noto per il suo comfort e supporto. Puoi vedere più dettagli qui:',
    humanAgentReply: 'Ciao! Sono un agente umano e intervengo ora. Ecco i miei suggerimenti personalizzati e i prossimi passi per te.',
    ctaText: 'Vedi Scarpe XYZ',
  },
};
