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
    searching: '🔍 Ricerca di prodotti adatti in corso...',
    reconnecting: 'Riconnessione in corso ({current}/{max})...',
    error: 'Si è verificato un errore di comunicazione.',
    connectionError: 'Si è verificato un errore di connessione.',
    reconnectFailed:
      'Impossibile ristabilire la connessione. Ricarica la pagina per riprovare.',
    configErrorApi: 'Errore di configurazione: URL API mancante.',
    sendError: 'Si è verificato un errore durante l\'invio del messaggio.',
  },
  product: {
    buyButton: 'Acquista',
  },
  demo: {
    // Testi specifici per la demo se differiscono significativamente, altrimenti riutilizza da 'widget' o 'status'
    initialMessage: 'Ciao, come posso aiutarti?',
    userMessage: 'Sto cercando scarpe da corsa comode.',
    botReply: 'Certamente! Abbiamo diverse opzioni. Ecco un modello molto popolare noto per il suo comfort e supporto. Puoi vedere più dettagli qui:',
    ctaText: 'Vedi Scarpe XYZ',
  },
};
