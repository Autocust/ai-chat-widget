<script>
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';

  export let title = 'AI Sales Assistant';
  export let apiUrl;
  export let initialMessage = 'Ciao, come posso aiutarti?'; // Keep initial message prop as is, can be overridden
  export let buttonIcon = '💬';
  export let ctaText = 'Chiedi informazioni'; // Keep default CTA prop as is
  export let position = 'bottom-right';
  export let openInNewTab = true;
  export let enableUTM = true;
  export let startOpen = false;
  export let fullScreen = false;
  export let isDemo = false; // New prop for demo mode

  // New Theming Props
  export let theme = 'light'; // 'light' or 'dark'
  export let userMessageBgColor = '#e0e0e0';
  export let userMessageTextColor = '#000000';
  export let assistantMessageBgColor = '#f8f8f8';
  export let assistantMessageTextColor = '#000000';
  export let chatButtonBgColor = '#000000';
  export let chatButtonTextColor = '#ffffff';
  export let ctaButtonBgColor = '#f8f8f8'; // Default matches assistant bg
  export let ctaButtonTextColor = '#000000'; // Default matches assistant text
  export let footerText = 'Generato dall\'IA. Verifica le informazioni importanti.'; // Keep footer prop as is
  export let showPoweredBy = true; // Show "Powered by" text by default
  export let agentId = 'xyz'; // Agent ID for backend identification
  export let cms = ''; // CMS type ('prestashop', 'woocommerce', etc.)

  // Corrected: Visibility depends *only* on startOpen
  let isChatVisible = startOpen;
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

  // --- Demo Content (Translated to English) ---
  const demoInitialMessage = "Hi, how can I help you?"; // Specific initial message for demo
  const demoUserMessage = "I'm looking for comfortable running shoes.";
  const demoBotReplyText = "Certainly! We have several options. Here is a very popular model known for its comfort and support. You can see more details here:";
  const demoCta = { text: "See Shoe XYZ", url: "#product-xyz" };
  const demoProducts = [
    { id: 1, name: "Comfort Running Shoe", price: 89.99, regular_price: 110.00, image: "https://via.placeholder.com/150/EEEEEE/000000?text=Shoe+1", url: "#product-1", brand: "Brand A" },
    { id: 2, name: "Lightweight Pro Shoe", price: 120.00, regular_price: 120.00, image: "https://via.placeholder.com/150/DDDDDD/000000?text=Shoe+2", url: "#product-2", brand: "Brand B" },
    { id: 3, name: "Trail Max Shoe", price: 99.50, regular_price: 130.00, image: "https://via.placeholder.com/150/CCCCCC/000000?text=Shoe+3", url: "#product-3", brand: "Brand A" },
  ];
  // --- End Demo Content ---

  function getSessionIdFromCookie() {
    const cookieName = 'chat_session_id';
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function saveSessionIdToCookie(sessionId) {
    // Crea un cookie di sessione (scompare alla chiusura del browser)
    document.cookie = `chat_session_id=${sessionId};path=/;SameSite=Lax`;
  }

  async function toggleChat() {
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      await tick();
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
      // Initialize WebSocket only if not in demo mode and not already connected
      if (!isDemo && !wsConnected && !isReconnecting) {
        initWebSocket();
      }
    } else if (!isDemo) { // Only manage WebSocket closing if not in demo mode
      clearTimeout(reconnectInterval);
      isReconnecting = false;
      reconnectAttempt = 0;
      if (ws) {
        ws.close(1000, 'Chat closed by user');
        wsConnected = false;
      }
    }
  }

  function initWebSocket() {
    if (isDemo) return; // Do nothing in demo mode

    if (!apiUrl) {
        console.error("API URL is not defined. WebSocket connection cannot be established.");
        addMessageToUI("Configuration Error: Missing API URL.", 'bot'); // Translated error
        return;
    }
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    ws = new WebSocket(`${wsUrl}/ws-chat?sessionId=${sessionId}&agentId=${encodeURIComponent(agentId)}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      wsConnected = true;
      isReconnecting = false;
      reconnectAttempt = 0;
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch(data.type) {
          case 'thinking':
            loadingState = {
              type: 'thinking',
              message: 'Thinking...' // Translated
            };
            break;

          case 'searching':
            loadingState = {
              type: 'searching',
              message: '🔍 Searching for suitable products...' // Translated
            };
            break;

          case 'token':
            loadingState = loadingState = {
              type: 'writing',
            };;

            currentBotMessage += data.content;

            if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
              messages = messages.slice(0, -1);
            }
            addMessageToUI(currentBotMessage, 'bot');
            break;

          case 'products_search':
            const products = await fetchProducts();
            if (products && products.length > 0) {
              const carousel = createProductCarousel(products);
              const lastMessage = messages[messages.length - 1];
              if (lastMessage && lastMessage.sender === 'bot') {
                messages[messages.length - 1] = {
                  ...lastMessage,
                  productCarousel: carousel
                };
                messages = [...messages];
              }
            }

          case 'done':
            loadingState = null;
            break;

          case 'error':
            loadingState = null;
            console.error('WebSocket error:', data.content);
            addMessageToUI("A communication error occurred.", 'bot'); // Translated error
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
        addMessageToUI('A connection error occurred.', 'bot'); // Translated error
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed');
      wsConnected = false;
      if (isChatVisible && event.code !== 1000 && !isReconnecting) {
        attemptReconnect();
      }
    };
  }

  function attemptReconnect() {
    if (isDemo || isReconnecting || reconnectAttempt >= maxReconnectAttempts) return; // Do nothing in demo mode

    isReconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 16000);

    if (reconnectAttempt > 0) {
      loadingState = {
        type: 'reconnecting',
        message: `Reconnecting (${reconnectAttempt}/${maxReconnectAttempts})...` // Translated
      };
    }

    console.log(`Attempting reconnect ${reconnectAttempt + 1}/${maxReconnectAttempts} in ${delay}ms`);

    clearTimeout(reconnectInterval);
    reconnectInterval = setTimeout(() => {
      reconnectAttempt++;
      if (reconnectAttempt >= maxReconnectAttempts) {
        loadingState = null;
        addMessageToUI("Could not re-establish connection. Please reload the page to try again.", 'bot'); // Translated error
        isReconnecting = false;
        return;
      }
      try {
        initWebSocket();
      } catch (err) {
        console.error('Reconnection failed:', err);
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
        ${renderAddToCartButton(product)} <!-- Use helper function -->
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
    if (isDemo) return demoProducts; // Return demo products in demo mode
    try {
      const response = await fetch(`${apiUrl}/products/${sessionId}`, {
        headers: {
          'X-Agent-ID': agentId
        }
      });
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
      ctaText: additionalData.ctaText || ctaText // Use default ctaText prop if not provided
    }];

    tick().then(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function formatPrice(price) {
    // Assuming Euro format for now, adjust if needed
    return `€${price.toFixed(2)}`;
  }

  function calculateDiscount(price, regularPrice) {
    if (!regularPrice || regularPrice <= price) return null;
    const discount = ((regularPrice - price) / regularPrice) * 100;
    return `-${Math.round(discount)}%`;
  }

  function addUtmParams(url, source, medium, campaign) {
    if (!enableUTM || url === '#' || !url) return url; // Don't add UTM to placeholder/invalid links
    try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('utm_source', source);
        urlObj.searchParams.set('utm_medium', medium);
        urlObj.searchParams.set('utm_campaign', campaign);
        return urlObj.toString();
    } catch (e) {
        console.warn("Could not add UTM params to invalid URL:", url);
        return url; // Return original URL if invalid
    }
  }

  async function sendMessage() {
    if (isDemo) return; // Do nothing in demo mode

    const message = userInput.trim();
    if (!message || !wsConnected) return;

    addMessageToUI(message, 'user');
    userInput = '';
    loadingState = {
      type: 'thinking',
      message: 'Thinking...' // Translated
    };
    currentBotMessage = '';

    try {
      ws.send(JSON.stringify({ chatInput: message }));
    } catch (err) {
      console.error("Error sending message:", err);
      addMessageToUI("An error occurred while sending the message.", 'bot'); // Translated error
    }
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function setupDemoMessages() {
      messages = []; // Clear existing messages
      addMessageToUI(demoInitialMessage, 'bot'); // Use specific demo initial message
      addMessageToUI(demoUserMessage, 'user');
      const demoCarouselHtml = createProductCarousel(demoProducts);
      addMessageToUI(demoBotReplyText, 'bot', {
          url: demoCta.url,
          ctaText: demoCta.text,
          productCarousel: demoCarouselHtml
      });
  }

  async function resetChat() {
    if (isDemo) {
        setupDemoMessages(); // Reset to demo state
        return;
    }

    try {
      const response = await fetch(`${apiUrl}/reset-session?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'X-Agent-ID': agentId
        }
      });
      if (!response.ok) {
        console.error('Reset chat failed:', await response.text());
        return;
      }
      // Reset to the original initial message from props
      messages = [];
      addMessageToUI(initialMessage, 'bot');
      currentBotMessage = '';
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
    if (!isDemo) {
        saveSessionIdToCookie(sessionId);
        // Add the initial message provided via prop
        addMessageToUI(initialMessage, 'bot');
        // Only connect WebSocket if startOpen is true (and not in demo)
        if (startOpen) {
            initWebSocket();
        }
    } else {
        // Setup demo mode messages
        setupDemoMessages();
    }

    return () => {
      // Cleanup WebSocket only if not in demo mode
      if (!isDemo) {
          if (ws) ws.close(1000);
          clearTimeout(reconnectInterval);
      }
    };
  });

  // Helper function to render the correct Add to Cart button/form based on CMS
  function renderAddToCartButton(product) {
    const buttonText = "Buy"; // Translated button text

    // In demo mode, always render a simple link
    if (isDemo || !cms) {
        return `
          <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart')}" target="_blank" class="add-to-cart">
            <span>${buttonText}</span>
          </a>
        `;
    }

    if (cms === 'prestashop') {
      // PrestaShop requires a form submission
      return `
        <form class="product-miniature__form" action="/carrello" method="post">
          <input type="hidden" name="id_product" value="${product.id}">
          <input type="hidden" name="id_product_attribute" value="${product.id_product_attribute || 0}">
          <input type="hidden" name="qty" value="1" class="form-control input-qty">
          <input type="hidden" name="token" value="${window.prestashop?.static_token || ''}">
          <input type="hidden" name="add" value="1">
          <button class="btn add-to-cart" data-button-action="add-to-cart" type="submit">
            <span>${buttonText}</span>
          </button>
        </form>
      `;
    }
    // Add other CMS checks here if needed in the future
    // else if (cms === 'woocommerce') { ... return woocommerce_button_html ... }

    // Default: Render a simple link (fallback behavior)
    return `
      <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart')}" target="_blank" class="add-to-cart">
        <span>${buttonText}</span>
      </a>
    `;
  }
</script>

<!-- Apply fullscreen class conditionally -->
<div
  id="chat-widget"
  class="{position} theme-{theme}"
  class:fullscreen="{isChatVisible && fullScreen}"
  style="
  --user-msg-bg: {userMessageBgColor};
  --user-msg-text: {userMessageTextColor};
  --assistant-msg-bg: {assistantMessageBgColor};
  --assistant-msg-text: {assistantMessageTextColor};
  --chat-btn-bg: {chatButtonBgColor};
  --chat-btn-text: {chatButtonTextColor};
  --cta-btn-bg: {ctaButtonBgColor};
  --cta-btn-text: {ctaButtonTextColor};
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
        <div>
          {title}{isDemo ? ' (Demo)' : ''}
        </div>
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
        {#if !isDemo && loadingState?.message}
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
          placeholder={isDemo ? "Demo mode - Input disabled" : "Write a message..."}
          disabled={isDemo}
          >
        <button
          id="send-button"
          disabled={isDemo || !!loadingState?.message || loadingState?.type === 'writing'}
          on:click={sendMessage}
        >
          Send
        </button>
      </div>
      <div id="chat-footer">{footerText}</div>
      {#if showPoweredBy}
        <div id="powered-by">
          Powered by <a href="https://www.autocust.it" target="_blank">Autocust</a>
        </div>
      {/if}
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
  --product-card-bg: #ffffff; /* Background for product cards */
  --product-card-shadow: rgba(0, 0, 0, 0.1); /* Shadow for product cards */
  --product-border-color: #f8f8f8;
  --add-to-cart-border-color: #000000;
  --add-to-cart-hover-bg: rgba(0, 0, 0, 0.05);
  --loading-bg: #f8f8f8;
  --loading-text-color: #666;
  --loading-dot-color: #666;
  --disabled-input-bg: #eeeeee;
  --disabled-button-bg: #cccccc;
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
  --product-card-bg: #3a3a3a; /* Background for product cards */
  --product-card-shadow: rgba(255, 255, 255, 0.1); /* Shadow for product cards */
  --product-border-color: #444444;
  --add-to-cart-border-color: #ffffff;
  --add-to-cart-hover-bg: rgba(255, 255, 255, 0.1);
  --loading-bg: #4a4a4a;
  --loading-text-color: #cccccc;
  --loading-dot-color: #cccccc;
  --disabled-input-bg: #555555;
  --disabled-button-bg: #777777;
}

#chat-widget {
  position: fixed;
  z-index: 1000;
  font-family: Arial, sans-serif;
}

/* Default positioning classes */
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

/* Fullscreen styles */
#chat-widget.fullscreen {
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100vw; /* Use viewport width */
  height: 100vh; /* Use viewport height */
  z-index: 2147483647; /* Max z-index */
}

#chat-widget.fullscreen #chat-container {
  width: 100%;
  height: 100%;
  border-radius: 0; /* Remove border radius in fullscreen */
  box-shadow: none; /* Remove shadow in fullscreen */
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
  flex-shrink: 0; /* Prevent header from shrinking */
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

/* Override default size on small screens if not fullscreen */
@media (max-width: 480px) {
  #chat-widget:not(.fullscreen) #chat-container {
    width: 90vw;
    height: calc(90vh - 20px);
  }
}

#chat-input {
  display: flex;
  padding: 10px 10px 0 10px;
  background-color: var(--input-area-bg); /* Use theme input area bg */
  flex-shrink: 0; /* Prevent input area from shrinking */
}

#chat-footer {
  text-align: center;
  font-size: 0.8rem;
  padding: 10px;
  background-color: var(--input-area-bg); /* Use theme input area bg */
  color: var(--disclaimer-text); /* Use theme disclaimer text */
  flex-shrink: 0; /* Prevent footer from shrinking */
}

#powered-by {
  text-align: center;
  font-size: 0.7rem; /* Smaller than footer */
  padding: 5px 10px 10px; /* Less top padding, more bottom */
  background-color: var(--input-area-bg); /* Match footer background */
  color: var(--disclaimer-text); /* Match footer text color */
  flex-shrink: 0; /* Prevent powered-by from shrinking */
}

#powered-by a {
  color: var(--disclaimer-text); /* Match footer text color */
  text-decoration: none;
}

#powered-by a:hover {
  text-decoration: underline;
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

#user-input:disabled {
  background-color: var(--disabled-input-bg); /* Theme disabled input */
  cursor: not-allowed;
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
  background-color: var(--disabled-button-bg); /* Theme disabled button */
  cursor: not-allowed;
}

/* Style CTA buttons */
.cta-button {
  display: inline-block;
  background-color: var(--cta-btn-bg); /* Use CTA button bg */
  color: var(--cta-btn-text); /* Use CTA button text */
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
  background-color: var(--product-card-bg); /* Use theme product card bg */
  border: 1px solid var(--product-border-color); /* Use theme product border */
  border-radius: 5px;
  padding: 10px;
  text-align: center;
  color: inherit;
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
}

:global(.carousel-product:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--product-card-shadow); /* Add theme-aware shadow on hover */
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
  background-color: var(--cta-btn-bg); /* Use CTA button bg */
  color: var(--cta-btn-text); /* Use CTA button text */
  border: none; /* Remove border */
  border-radius: 20px; /* Match CTA button radius */
  padding: 8px 12px;
  cursor: pointer;
  display: inline-block;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s, color 0.3s; /* Match CTA transition */
  margin: 10px auto 0;
  text-decoration: none;
  font-size: 14px; /* Match CTA font size */
  text-align: center; /* Match CTA text align */
  width: 100%; /* Match CTA width */
  box-sizing: border-box; /* Match CTA box sizing */
}

:global(.add-to-cart:hover) {
  background-color: var(--cta-hover-bg); /* Use theme hover color */
  color: var(--cta-hover-text); /* Use theme hover text color */
}
</style>
