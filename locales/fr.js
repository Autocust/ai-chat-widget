export default {
  widget: {
    title: "Assistant Commercial IA",
    initialMessage: "Bonjour, comment puis-je vous aider ?",
    ctaText: "Demander des informations",
    footerText:
      "Généré par IA. Veuillez vérifier les informations importantes.",
    placeholder: "Écrivez un message...",
    placeholderDisabled: "Mode démo - Saisie désactivée",
    sendButton: "Envoyer",
    resetTitle: "Réinitialiser le chat",
    closeTitle: "Fermer le chat", // Assuming '×' doesn't need translation, but title might
    poweredBy: "Powered by by",
    demoSuffix: "(Démo)",
  },
  status: {
    thinking: "Réflexion...",
    searching: "🔍 Recherche...",
    reconnecting: "Reconnexion...",
    error: "Une erreur de communication est survenue.",
    connectionError: "Une erreur de connexion est survenue.",
    reconnectFailed:
      "Impossible de rétablir la connexion. Veuillez recharger la page pour réessayer.",
    configErrorApi: "Erreur de configuration : URL de l'API manquante.",
    sendError: "Une erreur est survenue lors de l'envoi du message.",
    humanAgentJoined: "Un agent a rejoint le chat.",
    humanAgentLeft: "L'agent a quitté le chat.",
    assistantBack: "L'assistant est de retour en ligne."
  },
  product: {
    buyButton: "Acheter",
  },
  demo: {
    // Demo-specific texts if they differ significantly, otherwise reuse from 'widget' or 'status'
    initialMessage: "Bonjour, comment puis-je vous aider ?",
    userMessage: "Je cherche des chaussures de course confortables.",
    botReply:
      "Certainement ! Nous avons plusieurs options. Voici un modèle très populaire connu pour son confort et son soutien. Vous pouvez voir plus de détails ici :",
    humanAgentReply:
      "Bonjour ! Je suis un agent humain qui prend le relais. Voici mes recommandations personnalisées et les prochaines étapes pour vous.",
    ctaText: "Voir Chaussure XYZ",
  },
};
