<script>
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';

  export let title = 'AI Sales Assistant';
  export let apiUrl;
  export let initialMessage = 'Ciao, come posso aiutarti?';
  export let buttonIcon = '💬';
  export let ctaText = 'Chiedi informazioni';
  export let position = 'bottom-right';
  export let openInNewTab = true;
  export let enableUTM = true;
  // export let brandColor = '#000000'; // Removed brandColor

  // New Theming Props
  export let theme = 'light'; // 'light' or 'dark'
  export let userMessageBgColor = '#e0e0e0';
  export let userMessageTextColor = '#000000';
  export let assistantMessageBgColor = '#f8f8f8';
  export let assistantMessageTextColor = '#000000';
  export let chatButtonBgColor = '#000000';
  export let chatButtonTextColor = '#ffffff';

  let isChatVisible = false;
  let messages = [];
  let userInput = '';
  let loadingState = null;
  let chatMessages;
  let currentBotMessage = '';
  let ws;
  let wsConnected = false;
  let reconnectAttempt = 0;
  let maxReconnectAttempts = 5;
  let reconnectInterval = null;
  let isReconnecting = false;

  const sessionId = getSessionIdFromCookie() || generateUUID();

  $: isImageUrl = buttonIcon.match(/\.(jpeg|jpg|gif|png)$/) != null;
  $: isSvg = buttonIcon.trim().startsWith('<svg');

  function getSessionIdFromCookie() {
    const cookieName = 'chat_session_id';
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function saveSessionIdToCookie(sessionId) {
    // Crea un cookie di sessione (scompare alla chiusura del browser)
    document.cookie = `chat_session_id=${sessionId};path=/;SameSite=Lax`;
  }

  // Modifica la funzione toggleChat per gestire la connessione WebSocket
  async function toggleChat() {
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      await tick();
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
      // Inizializza WebSocket quando la chat viene aperta
      initWebSocket();
    } else {
      clearTimeout(reconnectInterval);
      isReconnecting = false;
      reconnectAttempt = 0;

      // Chiudi WebSocket quando la chat viene chiusa
      if (ws) {
        ws.close(1000, 'Chat closed by user');
        wsConnected = false;
      }
    }
  }

  function initWebSocket() {
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    ws = new WebSocket(`${wsUrl}/ws-chat?sessionId=${sessionId}`);

    ws.onopen = () => {
    console.log('WebSocket connected');
      wsConnected = true;
      isReconnecting = false;
      reconnectAttempt = 0; // Reset dei tentativi quando la connessione ha successo
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch(data.type) {
          case 'thinking':
            loadingState = {
              type: 'thinking',
              message: 'Sto pensando'
            };
            break;

          case 'searching':
            loadingState = {
              type: 'searching',
              message: '🔍 Cerco i prodotti più adatti'
            };
            break;

          case 'token':
            loadingState = loadingState = {
              type: 'writing',
            };;

            // Accumula il testo del messaggio
            currentBotMessage += data.content;

            // Aggiorna o aggiungi il messaggio in progress
            if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
              messages = messages.slice(0, -1);
            }
            addMessageToUI(currentBotMessage, 'bot');
            break;

          case 'products_search':
            // Fetch products and create carousel if available
            const products = await fetchProducts();
            if (products && products.length > 0) {
              const carousel = createProductCarousel(products);
              // Aggiorna l'ultimo messaggio del bot con il carosello
              const lastMessage = messages[messages.length - 1];
              if (lastMessage && lastMessage.sender === 'bot') {
                messages[messages.length - 1] = {
                  ...lastMessage,
                  productCarousel: carousel
                };
                messages = [...messages]; // Trigger reattività
              }
            }

          case 'done':
            loadingState = null;
            break;

          case 'error':
            loadingState = null;
            console.error('WebSocket error:', data.content);
            addMessageToUI("Si è verificato un errore nella comunicazione.", 'bot');
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      wsConnected = false;
      loadingState = null;
      if (!isReconnecting) {
        addMessageToUI('Si è verificato un errore nella connessione.', 'bot');
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed');
      wsConnected = false;

      // Tenta la riconnessione solo se:
      // 1. La chat è ancora visibile
      // 2. Non è una chiusura normale (codice 1000)
      // 3. Non stiamo già tentando la riconnessione
      if (isChatVisible && event.code !== 1000 && !isReconnecting) {
        attemptReconnect();
      }
    };
  }

  function attemptReconnect() {
    if (isReconnecting || reconnectAttempt >= maxReconnectAttempts) return;

    isReconnecting = true;

    // Calcola delay con backoff esponenziale (1s, 2s, 4s, 8s, 16s)
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 16000);

    // Mostra messaggio di riconnessione dopo il primo tentativo
    if (reconnectAttempt > 0) {
      loadingState = {
        type: 'reconnecting',
        message: `Riconnessione in corso (${reconnectAttempt}/${maxReconnectAttempts})`
      };
    }

    console.log(`Attempting reconnect ${reconnectAttempt + 1}/${maxReconnectAttempts} in ${delay}ms`);

    clearTimeout(reconnectInterval);
    reconnectInterval = setTimeout(() => {
      reconnectAttempt++;

      // Se si tratta dell'ultimo tentativo
      if (reconnectAttempt >= maxReconnectAttempts) {
        loadingState = null;
        addMessageToUI("Impossibile ristabilire la connessione. Ricarica la pagina per riprovare.", 'bot');
        isReconnecting = false;
        return;
      }

      // Tenta di riconnettersi
      try {
        initWebSocket();
      } catch (err) {
        console.error('Reconnection failed:', err);
        // Se fallisce, riprova
        attemptReconnect();
      }
    }, delay);
  }

  function createProductCarousel(products) {
    if (!products || products.length === 0) return '';

    const productCards = products.map(product => `
      <div class="carousel-product">
        <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot')}" target="_blank" class="product-link">
          ${product.regular_price && product.regular_price > product.price ?
            `<span class="discount-label">${calculateDiscount(product.price, product.regular_price)}</span>` : ''}
          <img src="${product.image}" alt="${product.name}">
          ${product.brand ? `<div class="product-brand">${product.brand}</div>` : ''}
          <h4>${product.name}</h4>
          <div class="product-price">
            ${product.regular_price && product.regular_price !== product.price ?
              `<span class="regular-price">${formatPrice(product.regular_price)}</span>` : ''}
            <span class="current-price">${formatPrice(product.price)}</span>
          </div>
        </a>
        <form class="product-miniature__form" action="/carrello" method="post">
          <input type="hidden" name="id_product" value="${product.id}">
          <input type="hidden" name="id_product_attribute" value="${product.id_product_attribute}">
          <input type="hidden" name="qty" value="1" class="form-control input-qty">
          <input type="hidden" name="token" value="${window.prestashop?.static_token || ''}">
          <input type="hidden" name="add" value="1">
          <button class="btn add-to-cart" data-button-action="add-to-cart" type="submit">
            <span>Acquista</span>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 25 25">
              <path d="M19.48,18.88h-11.02c-.78,0-1.49-.5-1.75-1.24L2.25,5.02c-.14-.39-.51-.65-.92-.65-.38,0-.69-.31-.69-.69s.31-.69.69-.69c.99,0,1.88.63,2.21,1.57l.55,1.56h18.7c.21,0,.4.09.53.25s.18.37.14.57l-2.17,10.46c-.18.86-.94,1.48-1.82,1.48ZM4.58,7.49l3.43,9.69c.07.19.25.32.45.32h11.02c.23,0,.42-.16.47-.38l2-9.63H4.58Z"></path>
              <g>
                <circle cx="18.38" cy="21.38" r="1.71"></circle>
                <circle cx="9.64" cy="21.38" r="1.71"></circle>
              </g>
              <g>
                <g>
                  <circle fill="#00cb51" cx="18.27" cy="8.18" r="5.25"></circle>
                  <path d="M18.27,14.22c-3.33,0-6.04-2.71-6.04-6.04s2.71-6.04,6.04-6.04,6.04,2.71,6.04,6.04-2.71,6.04-6.04,6.04ZM18.27,3.71c-2.46,0-4.46,2-4.46,4.46s2,4.46,4.46,4.46,4.46-2,4.46-4.46-2-4.46-4.46-4.46Z"></path>
                </g>
                <g>
                  <path fill="#fff" d="M18.27,11.16c-.31,0-.56-.25-.56-.56v-4.83c0-.31.25-.56.56-.56s.56.25.56.56v4.83c0,.31-.25.56-.56.56Z"></path>
                  <path fill="#fff" d="M20.68,8.74h-4.83c-.31,0-.56-.25-.56-.56s.25-.56.56-.56h4.83c.31,0,.56.25.56.56s-.25.56-.56.56Z"></path>
                </g>
              </g>
            </svg>
          </button>
        </form>
      </div>
    `).join('');

    return `
      <div class="product-carousel">
        ${productCards}
      </div>
    `;
  }

  function extractLinks(markdownText) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(markdownText)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      });
    }

    return links;
  }

  async function fetchProducts() {
    try {
      const response = await fetch(`${apiUrl}/products/${sessionId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return null;
    }
  }

  function addMessageToUI(content, sender, additionalData = {}) {
    let messageContent = content;
    let links = [];

    if (sender === 'bot') {
      links = extractLinks(content);
      messageContent = marked.parse(content);
      messageContent = messageContent.replace(/\【.*?】/g, '');
    }

    messages = [...messages, {
      content: messageContent,
      sender,
      links,
      productCarousel: additionalData.productCarousel || '',
      url: additionalData.url || '',
      ctaText: additionalData.ctaText || ctaText
    }];

    tick().then(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function formatPrice(price) {
    return `${price.toFixed(2).replace('.', ',')} €`;
  }

  function calculateDiscount(price, regularPrice) {
    if (!regularPrice || regularPrice <= price) return null;
    const discount = ((regularPrice - price) / regularPrice) * 100;
    return `-${Math.round(discount)}%`;
  }

  function addUtmParams(url, source, medium, campaign) {
    if (!enableUTM) return url;
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', medium);
    urlObj.searchParams.set('utm_campaign', campaign);
    return urlObj.toString();
  }

  async function sendMessage() {
    const message = userInput.trim();
    if (!message || !wsConnected) return;

    addMessageToUI(message, 'user');
    userInput = '';
    loadingState = {
      type: 'thinking',
      message: 'Sto pensando'
    };
    currentBotMessage = '';

    try {
      ws.send(JSON.stringify({ chatInput: message }));
    } catch (err) {
      console.error("Error sending message:", err);
      addMessageToUI("Si è verificato un errore nell'invio del messaggio.", 'bot');
    }
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async function resetChat() {
    try {
      const response = await fetch(`${apiUrl}/reset-session?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.error('Reset chat failed:', await response.text());
        return;
      }
      // Mantieni il primo messaggio e svuota il resto
      messages = messages.length ? messages.slice(0, 1) : [];
      currentBotMessage = '';
      // Chiudi e reinizializza la connessione WebSocket
      if (ws) {
        ws.close(1000, 'Session reset');
      }
      if (isChatVisible) {
        initWebSocket();
      }
    } catch (err) {
      console.error('Error resetting chat:', err);
    }
  }

  onMount(() => {
    saveSessionIdToCookie(sessionId);
    addMessageToUI(initialMessage, 'bot');

    return () => {
      // Cleanup
      if (ws) ws.close(1000);
      clearTimeout(reconnectInterval);
    };
  });
</script>

<!-- Template remains largely unchanged -->
<div id="chat-widget" class="{position} theme-{theme}" style="
  --user-msg-bg: {userMessageBgColor};
  --user-msg-text: {userMessageTextColor};
  --assistant-msg-bg: {assistantMessageBgColor};
  --assistant-msg-text: {assistantMessageTextColor};
  --chat-btn-bg: {chatButtonBgColor};
  --chat-btn-text: {chatButtonTextColor};
">
  {#if !isChatVisible}
    <button id="chat-button" on:click={toggleChat}>
      {#if isImageUrl}
        <img src={buttonIcon} alt="Chat" />
      {:else if isSvg}
        {@html buttonIcon}
      {:else}
        {@html buttonIcon}
      {/if}
    </button>
  {/if}

  {#if isChatVisible}
    <div id="chat-container">
      <div id="chat-header">
        <div>{title}</div>
        <div class="header-buttons">
          <button id="reset-chat" on:click={resetChat} title="Reset Chat">↺</button>
          <button id="close-chat" on:click={toggleChat}>×</button>
        </div>
      </div>
      <div id="chat-messages" bind:this={chatMessages}>
        {#each messages as message}
          <div class="message {message.sender}-message">
            {@html message.content}
          </div>
          {#if message.url}
            <a href={addUtmParams(message.url, 'chat', 'chatbot', 'chatbot')}
               target={openInNewTab ? '_blank' : '_self'}
               class="cta-button">{message.ctaText}</a>
          {/if}
          {#if message.links && message.links.length > 0}
            <div class="message-links">
              {#each message.links as link}
                <a href={addUtmParams(link.url, 'chat', 'chatbot', 'chatbot')}
                  target="_blank"
                  class="cta-button">
                  {link.text}
                </a>
              {/each}
            </div>
          {/if}
          {#if message.productCarousel}
            {@html message.productCarousel}
          {/if}
        {/each}
        {#if loadingState?.message}
          <div class="loading-container">
            <div class="loading-indicator">
              <span class="loading-text">{loadingState.message}</span>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        {/if}
      </div>
      <div id="chat-input">
        <input
          type="text"
          id="user-input"
          bind:value={userInput}
          on:keypress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Scrivi un messaggio...">
        <button
          id="send-button"
          disabled="{!!loadingState?.message || loadingState?.type === 'writing'}"
          on:click={sendMessage}
        >
          Invia
        </button>
      </div>
      <div id="chat-disclaimer">Generato dall'IA. Verifica le informazioni importanti.</div>
    </div>
  {/if}
</div>

<style>
/* Theme Variables */
.theme-light {
  --container-bg: #e0e0e0;
  --header-bg: #e8e8e8;
  --header-text: #000000;
  --messages-bg: #ffffff;
  --input-area-bg: #e8e8e8;
  --input-bg: #ffffff;
  --input-text: #000000;
  --send-button-bg: #000000;
  --send-button-text: #ffffff;
  --disclaimer-text: #656565;
  --primary-text-color: #000000;
  --link-color: #000000;
  --cta-hover-bg: #000000;
  --cta-hover-text: #ffffff;
  --product-border-color: #f8f8f8;
  --add-to-cart-border-color: #000000;
  --add-to-cart-hover-bg: rgba(0, 0, 0, 0.05);
  --loading-bg: #f8f8f8;
  --loading-text-color: #666;
  --loading-dot-color: #666;
}

.theme-dark {
  --container-bg: #2a2a2a;
  --header-bg: #1e1e1e;
  --header-text: #ffffff;
  --messages-bg: #333333;
  --input-area-bg: #1e1e1e;
  --input-bg: #4a4a4a;
  --input-text: #ffffff;
  --send-button-bg: #5a5a5a;
  --send-button-text: #ffffff;
  --disclaimer-text: #aaaaaa;
  --primary-text-color: #ffffff;
  --link-color: #eeeeee;
  --cta-hover-bg: #ffffff;
  --cta-hover-text: #000000;
  --product-border-color: #444444;
  --add-to-cart-border-color: #ffffff;
  --add-to-cart-hover-bg: rgba(255, 255, 255, 0.1);
  --loading-bg: #4a4a4a;
  --loading-text-color: #cccccc;
  --loading-dot-color: #cccccc;
}

#chat-widget {
  position: fixed;
  z-index: 1000;
  font-family: Arial, sans-serif;
}

.top-left {
  top: 20px;
  left: 20px;
}

.top-right {
  top: 20px;
  right: 20px;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}

#chat-button {
  background-color: var(--chat-btn-bg) !important; /* Use chat button bg */
  color: var(--chat-btn-text) !important; /* Use chat button text */
  border: none;
  border-radius: 50%;
  width: 60px !important;
  height: 60px !important;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto;
}

#chat-button img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

#chat-container {
  width: 340px;
  height: 485px;
  background-color: var(--container-bg); /* Use theme container bg */
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--header-bg); /* Use theme header bg */
  color: var(--header-text); /* Use theme header text */
  padding: 10px 10px 10px 14px;
}

.header-buttons {
  display: flex;
  gap: 5px;
}

#reset-chat,
#close-chat {
  background: none;
  border: none;
  color: var(--header-text); /* Use theme header text */
  font-size: 20px;
  line-height: 20px;
  padding: 10px;
  cursor: pointer;
}

#chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: var(--messages-bg); /* Use theme messages bg */
  color: var(--primary-text-color); /* Use theme primary text */
}

.message {
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  line-height: 1.5rem;
  height: auto;
  width: auto;
  max-width: 80%;
  display: block;
  text-transform: none;
}

.message a {
  color: var(--link-color); /* Use theme link color */
}

:global(.message ul),
:global(.message ol) {
  padding-inline-start: 20px;
}

.user-message {
  background-color: var(--user-msg-bg); /* Use user message bg */
  color: var(--user-msg-text); /* Use user message text */
  margin-left: auto;
}

.bot-message {
  background-color: var(--assistant-msg-bg); /* Use assistant message bg */
  color: var(--assistant-msg-text); /* Use assistant message text */
  align-self: flex-start;
}

.loading-container {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--loading-bg); /* Use theme loading bg */
  border-radius: 16px;
  max-width: fit-content;
  animation: fadeInOut 2s infinite;
}

.loading-indicator {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.loading-text {
  color: var(--loading-text-color); /* Use theme loading text */
  font-size: 14px;
}

.typing-dots {
  display: flex;
  gap: 2px;
  padding-bottom: 2px;
  padding-left: 2px;
}

.typing-dots span {
  width: 2px;
  height: 2px;
  background-color: var(--loading-dot-color); /* Use theme loading dot */
  border-radius: 50%;
  display: inline-block;
  animation: customBounce 1s infinite;
}

.typing-dots span:nth-child(1) { animation-delay: 0ms; }
.typing-dots span:nth-child(2) { animation-delay: 200ms; }
.typing-dots span:nth-child(3) { animation-delay: 400ms; }

@keyframes customBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 480px) {
  #chat-container {
    width: 90vw;
    height: calc(90vh - 20px);
  }
}

#chat-input {
  display: flex;
  padding: 10px 10px 0 10px;
  background-color: var(--input-area-bg); /* Use theme input area bg */
}

#chat-disclaimer {
  text-align: center;
  font-size: 0.8rem;
  padding: 10px;
  background-color: var(--input-area-bg); /* Use theme input area bg */
  color: var(--disclaimer-text); /* Use theme disclaimer text */
}

#user-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd; /* Consider theming this border? */
  border-radius: 3px;
  background-color: var(--input-bg); /* Use theme input bg */
  color: var(--input-text); /* Use theme input text */
  font-size: 16px;
}

#send-button {
  background-color: var(--send-button-bg); /* Use theme send button bg */
  color: var(--send-button-text); /* Use theme send button text */
  border: none;
  padding: 10px 15px;
  margin-left: 5px;
  cursor: pointer;
  border-radius: 3px;
  text-wrap: nowrap;
  min-width: 60px;
}

#send-button:disabled {
  background-color: #ccc;
}

/* Style CTA buttons like assistant messages for now */
.cta-button {
  display: inline-block;
  background-color: var(--assistant-msg-bg);
  color: var(--assistant-msg-text);
  padding: 8px 12px;
  border-radius: 20px;
  text-decoration: none;
  margin-bottom: 10px;
  font-size: 14px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  transition: background-color 0.3s, color 0.3s;
}

.cta-button:hover {
  background-color: var(--cta-hover-bg); /* Use theme hover color */
  color: var(--cta-hover-text); /* Use theme hover text color */
}

:global(.product-carousel) {
  display: flex;
  overflow-x: auto;
  padding: 10px 0;
  margin-top: 10px;
}

:global(.carousel-product) {
  flex: 0 0 auto;
  width: 150px;
  margin-right: 10px;
  border: 1px solid var(--product-border-color); /* Use theme product border */
  border-radius: 5px;
  padding: 10px;
  text-align: center;
  color: inherit;
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
}

:global(.product-link) {
  text-decoration: none;
  color: inherit;
  display: block;
  position: relative;
}

:global(.discount-label) {
  position: absolute;
  top: 0;
  left: -10px;
  background-color: #666;
  color: white;
  padding: 6px 10px;
  font-size: 12px;
}

:global(.carousel-product:hover) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.product-link img) {
  width: 100%;
  height: 100px;
  object-fit: cover;
  margin-bottom: 5px;
}

:global(.carousel-product h4) {
  margin: 5px 0;
  font-size: 14px;
  color: var(--primary-text-color); /* Use theme primary text */
}

:global(.product-brand) {
  font-size: 12px;
  color: var(--disclaimer-text); /* Use theme secondary text color */
  margin: 5px 0;
}

:global(.product-price) {
  margin: 5px 0;
  color: var(--primary-text-color); /* Use theme primary text */
}

:global(.current-price) {
  font-weight: bold;
  font-size: 16px;
}

:global(.regular-price) {
  text-decoration: line-through #8B0000 2px;
  color: inherit;
  font-size: 14px;
  margin-right: 5px;
}

:global(.product-miniature__form) {
  margin-top: 10px;
}

:global(.add-to-cart) {
  background: transparent;
  border: 1px solid var(--add-to-cart-border-color); /* Use theme border */
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  margin: 0 auto;
}

:global(.add-to-cart svg) {
  width: 20px;
  height: 20px;
}

:global(.add-to-cart:hover) {
  background-color: var(--add-to-cart-hover-bg); /* Use theme hover bg */
}
</style>
