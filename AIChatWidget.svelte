<script>
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import { _ } from './i18n'; // Import the translation function

  // --- Props ---
  // Keep props as they are, they allow overriding the defaults
  export let title = null;
  export let apiUrl;
  export let initialMessage = null;
  export let buttonIcon = '💬';
  export let ctaText = null;
  export let position = 'bottom-right';
  export let openInNewTab = true;
  export let enableUTM = true;
  export let startOpen = false;
  export let fullScreen = false;
  export let isDemo = false;
  export let closable = true;
  export let theme = 'light';
  export let userMessageBgColor = '#e0e0e0';
  export let userMessageTextColor = '#000000';
  export let assistantMessageBgColor = '#f8f8f8';
  export let assistantMessageTextColor = '#000000';
  export let chatButtonBgColor = '#000000';
  export let chatButtonTextColor = '#ffffff';
  export let ctaButtonBgColor = '#f8f8f8';
  export let ctaButtonTextColor = '#000000';
  export let footerText = null;
  export let showPoweredBy = true;
  export let agentId = 'xyz';
  export let cms = '';

  // --- Reactive variables for props with translatable defaults ---
  // Use the prop value if provided, otherwise use the translated default
  $: displayTitle = title ?? $_('widget.title');
  $: displayInitialMessage = initialMessage ?? $_('widget.initialMessage');
  $: displayCtaText = ctaText ?? $_('widget.ctaText');
  $: displayFooterText = footerText ?? $_('widget.footerText');

  // --- Internal State ---
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

  // --- Demo Content ---
  // Make demo constants reactive to ensure $_ is ready
  $: demoInitialMessage = $_('demo.initialMessage');
  $: demoUserMessage = $_('demo.userMessage');
  $: demoBotReplyText = $_('demo.botReply');
  $: demoCta = { text: $_('demo.ctaText'), url: "#product-xyz" };
  const demoProducts = [ // Product details likely don't need reactivity
    { id: 1, name: "Comfort Running Shoe", price: 89.99, regular_price: 110.00, image: "https://fakeimg.pl/600x400", url: "#product-1", brand: "Brand A" },
    { id: 2, name: "Lightweight Pro Shoe", price: 120.00, regular_price: 120.00, image: "https://fakeimg.pl/600x400", url: "#product-2", brand: "Brand B" },
    { id: 3, name: "Trail Max Shoe", price: 99.50, regular_price: 130.00, image: "https://fakeimg.pl/600x400", url: "#product-3", brand: "Brand A" },
  ];
  // --- End Demo Content ---

  function getSessionIdFromCookie() {
    const cookieName = 'chat_session_id';
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function saveSessionIdToCookie(sessionId) {
    document.cookie = `chat_session_id=${sessionId};path=/;SameSite=Lax`;
  }

  async function toggleChat() {
    if (!closable && isChatVisible) {
        return;
    }
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      await tick();
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
      if (!isDemo && !wsConnected && !isReconnecting) {
        initWebSocket();
      }
    } else if (!isDemo) {
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
    if (isDemo) return;

    if (!apiUrl) {
        console.error("API URL is not defined. WebSocket connection cannot be established.");
        // Use translated error message
        addMessageToUI($_('status.configErrorApi'), 'bot');
        return;
    }
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    ws = new WebSocket(`${wsUrl}/ws-chat?sessionId=${sessionId}&agentId=${encodeURIComponent(agentId)}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      wsConnected = true;
      isReconnecting = false;
      reconnectAttempt = 0;
      loadingState = null; // Clear reconnecting message on successful connection
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch(data.type) {
          case 'thinking':
            loadingState = {
              type: 'thinking',
              message: $_('status.thinking') // Translated
            };
            break;

          case 'searching':
            loadingState = {
              type: 'searching',
              message: $_('status.searching') // Translated
            };
            break;

          case 'token':
            loadingState = { type: 'writing' }; // No visible text needed for writing state itself
            currentBotMessage += data.content;
            if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
              // Replace the last bot message content instead of adding a new one
              messages[messages.length - 1].content = marked.parse(currentBotMessage.replace(/\【.*?】/g, ''));
              messages = [...messages]; // Trigger reactivity
            } else {
              // Add a new bot message if the last one wasn't from the bot or if messages is empty
               addMessageToUI(currentBotMessage, 'bot');
            }
            // Ensure scroll after update
            tick().then(() => {
              if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
            });
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
                messages = [...messages]; // Trigger reactivity
              } else {
                 // If the last message wasn't a bot message, maybe add a new one with the carousel?
                 // This case needs clarification based on expected backend behavior.
                 // For now, let's assume products_search follows a bot message.
              }
            }
            // Assuming products_search might not always end the turn, no break here.
            // If it *does* end the turn, add break;
            break; // Added break assuming product search is a distinct step before done

          case 'done':
            loadingState = null;
            currentBotMessage = ''; // Reset current message buffer on done
            break;

          case 'error':
            loadingState = null;
            console.error('WebSocket error:', data.content);
            addMessageToUI($_('status.error'), 'bot'); // Translated error
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
        // Maybe add a generic UI error message here too?
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      wsConnected = false;
      loadingState = null; // Clear loading state on error
      if (!isReconnecting) {
        addMessageToUI($_('status.connectionError'), 'bot'); // Translated error
      }
      // If we were trying to reconnect, let the reconnect logic handle the next step
      if (isReconnecting) {
          // The reconnect attempt failed, the timeout in attemptReconnect will trigger the next step
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      wsConnected = false;
      // Only attempt reconnect if the closure was unexpected and the chat should be open
      if (isChatVisible && event.code !== 1000 && !isReconnecting) {
        attemptReconnect();
      } else if (event.code !== 1000 && isReconnecting) {
          // If it closed during a reconnect attempt, let the timer handle the next attempt or failure
      } else {
          // Normal closure (1000) or closed while chat hidden/not reconnecting
          isReconnecting = false; // Ensure flag is reset
          loadingState = null; // Clear any loading state
      }
    };
  }

  function attemptReconnect() {
    if (isDemo || isReconnecting || reconnectAttempt >= maxReconnectAttempts) return;

    isReconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 16000); // Exponential backoff up to 16s

    // Use translated reconnect message with variables
    // Show reconnecting message immediately
    loadingState = {
      type: 'reconnecting',
      message: $_('status.reconnecting', { values: { current: reconnectAttempt + 1, max: maxReconnectAttempts } })
    };


    console.log(`Attempting reconnect ${reconnectAttempt + 1}/${maxReconnectAttempts} in ${delay}ms`);

    clearTimeout(reconnectInterval); // Clear previous timer if any
    reconnectInterval = setTimeout(() => {
      // Check if still relevant before attempting
      if (!isChatVisible) { // Don't reconnect if chat was closed
          isReconnecting = false;
          loadingState = null; // Clear loading state if chat closed
          console.log('Reconnect aborted: Chat closed.');
          return;
      }
       if (wsConnected) { // Don't reconnect if already connected (e.g., manually reopened)
          isReconnecting = false;
          loadingState = null; // Clear loading state
          console.log('Reconnect aborted: Already connected.');
          return;
      }


      reconnectAttempt++;
      if (reconnectAttempt > maxReconnectAttempts) {
        loadingState = null;
        // Use translated failure message
        addMessageToUI($_('status.reconnectFailed'), 'bot');
        isReconnecting = false;
        console.log('Max reconnect attempts reached.');
        return;
      }
      try {
        console.log(`Executing reconnect attempt ${reconnectAttempt}`);
        // Update loading message for subsequent attempts
         loadingState = {
            type: 'reconnecting',
            message: $_('status.reconnecting', { values: { current: reconnectAttempt, max: maxReconnectAttempts } })
         };
        initWebSocket(); // Attempt to reconnect
        // Don't immediately assume success, wait for onopen or onerror/onclose
      } catch (err) {
        console.error('Reconnection failed immediately during initWebSocket:', err);
        // Error during initWebSocket itself (unlikely but possible)
        isReconnecting = false; // Reset flag
        loadingState = null;
        addMessageToUI($_('status.reconnectFailed'), 'bot'); // Fail if init throws
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
        ${renderAddToCartButton(product)}
      </div>
    `).join('');
    return `<div class="product-carousel">${productCards}</div>`;
  }

  function extractLinks(markdownText) {
    if (!markdownText) return [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(markdownText)) !== null) {
      links.push({ text: match[1], url: match[2] });
    }
    return links;
  }

  async function fetchProducts() {
    if (isDemo) return demoProducts;
    try {
      const response = await fetch(`${apiUrl}/products/${sessionId}`, { headers: { 'X-Agent-ID': agentId } });
      if (!response.ok) {
          console.error(`Error fetching products: ${response.status} ${response.statusText}`);
          return null;
      }
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
      // Ensure marked is used safely if content could be malicious
      // Consider using a sanitizer library like DOMPurify after marked if content isn't fully trusted
      messageContent = marked.parse(content || ''); // Ensure content is not null/undefined
      messageContent = messageContent.replace(/\【.*?】/g, ''); // Remove potential placeholders if needed
    }

    messages = [...messages, {
      content: messageContent,
      sender,
      links,
      productCarousel: additionalData.productCarousel || '',
      url: additionalData.url || '',
      // Use the *displayed* CTA text (prop override or translated default)
      ctaText: additionalData.ctaText || displayCtaText
    }];

    // Scroll to bottom when a new message is added
    tick().then(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function formatPrice(price) {
    // Basic Euro formatting, consider Intl.NumberFormat for better localization
     try {
        // Attempt to use browser language, fallback to 'en' if needed
        const locale = navigator.language || 'en';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(price);
     } catch (e) {
        console.warn("Intl.NumberFormat failed, falling back to basic format.", e);
        return `€${Number(price).toFixed(2)}`; // Fallback
     }
  }

  function calculateDiscount(price, regularPrice) {
    if (!regularPrice || regularPrice <= price) return null;
    const discount = ((regularPrice - price) / regularPrice) * 100;
    return `-${Math.round(discount)}%`;
  }

  function addUtmParams(url, source, medium, campaign) {
    if (!enableUTM || !url || url.startsWith('#')) return url; // Don't add UTM to invalid/anchor links
    try {
        const urlObj = new URL(url, window.location.origin); // Use base URL for relative paths
        urlObj.searchParams.set('utm_source', source);
        urlObj.searchParams.set('utm_medium', medium);
        urlObj.searchParams.set('utm_campaign', campaign);
        return urlObj.toString();
    } catch (e) {
        console.warn("Could not add UTM params to invalid URL:", url, e);
        return url; // Return original URL if invalid
    }
  }

  async function sendMessage() {
    if (isDemo) return;

    const message = userInput.trim();
    // Prevent sending if not connected, already loading, or message is empty
    if (!message || !wsConnected || loadingState) return;

    addMessageToUI(message, 'user');
    userInput = '';
    loadingState = { type: 'thinking', message: $_('status.thinking') }; // Translated
    currentBotMessage = ''; // Reset bot message buffer

    try {
      ws.send(JSON.stringify({ chatInput: message }));
    } catch (err) {
      console.error("Error sending message:", err);
      addMessageToUI($_('status.sendError'), 'bot'); // Translated error
      loadingState = null; // Clear loading state on send error
    }
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function setupDemoMessages() {
      messages = [];
      // Use reactive demo variables which depend on $_
      addMessageToUI(demoInitialMessage, 'bot');
      addMessageToUI(demoUserMessage, 'user');
      const demoCarouselHtml = createProductCarousel(demoProducts);
      addMessageToUI(demoBotReplyText, 'bot', {
          url: demoCta.url,
          ctaText: demoCta.text,
          productCarousel: demoCarouselHtml
      });
      // Ensure scroll after setting up demo messages
      tick().then(() => {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      });
  }

  async function resetChat() {
    if (isDemo) {
        setupDemoMessages();
        return;
    }

    // Clear local state immediately for responsiveness
    messages = [];
    currentBotMessage = '';
    loadingState = null;
    addMessageToUI(displayInitialMessage, 'bot'); // Add initial message back immediately
    tick().then(() => {
        if (chatMessages) chatMessages.scrollTop = 0; // Scroll to top after reset
    });


    // Close existing connection if open
    if (ws) {
      ws.close(1000, 'Session reset');
      wsConnected = false; // Assume closed until new connection opens
    }
    clearTimeout(reconnectInterval); // Stop any reconnect attempts
    isReconnecting = false;
    reconnectAttempt = 0;


    // Send reset request to backend
    try {
      const response = await fetch(`${apiUrl}/reset-session?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: { 'X-Agent-ID': agentId }
      });
      if (!response.ok) {
        console.error('Reset chat failed on backend:', await response.text());
        // Optionally inform user of backend reset failure
      } else {
          console.log('Session reset successfully on backend.');
      }
    } catch (err) {
      console.error('Error sending reset chat request:', err);
      // Optionally inform user of network error during reset
    }

    // Re-initialize WebSocket if the chat is currently visible
    if (isChatVisible) {
      initWebSocket();
    }
  }

  onMount(() => {
    // svelte-i18n's init is called in i18n.js, which is imported top-level in main/embed.
    // The reactive declarations ($:) and store subscriptions handle waiting for the locale.
    // We just need to ensure the initial message is added once.
    if (!isDemo) {
        saveSessionIdToCookie(sessionId);
        // Add the initial message only if messages array is currently empty
        if (messages.length === 0) {
             addMessageToUI(displayInitialMessage, 'bot');
        }
        if (startOpen) {
            // Connect only if not already connected (e.g. component remount)
            if (!wsConnected && !isReconnecting) {
                initWebSocket();
            }
        }
    } else {
        setupDemoMessages();
    }


    return () => {
      // Cleanup WebSocket only if not in demo mode
      if (!isDemo) {
          if (ws) {
              ws.close(1000, 'Component unmounted');
              wsConnected = false;
          }
          clearTimeout(reconnectInterval); // Clear any pending reconnect timers
          isReconnecting = false;
      }
    };
  });

  // Helper function to render the correct Add to Cart button/form based on CMS
  function renderAddToCartButton(product) {
    // Use translated button text
    const buttonText = $_('product.buyButton');

    if (isDemo || !cms) {
        return `
          <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart')}" target="_blank" class="add-to-cart">
            <span>${buttonText}</span>
          </a>
        `;
    }

    if (cms === 'prestashop') {
      // PrestaShop requires a form submission
      // Ensure window.prestashop is checked safely
      const prestashopToken = typeof window !== 'undefined' && window.prestashop ? window.prestashop.static_token : '';
      return `
        <form class="product-miniature__form" action="/carrello" method="post">
          <input type="hidden" name="id_product" value="${product.id}">
          <input type="hidden" name="id_product_attribute" value="${product.id_product_attribute || 0}">
          <input type="hidden" name="qty" value="1" class="form-control input-qty">
          <input type="hidden" name="token" value="${prestashopToken}">
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
    <button id="chat-button" on:click={toggleChat} aria-label={$_('widget.title')}> <!-- Add aria-label for accessibility -->
      {#if isImageUrl}
        <img src={buttonIcon} alt={$_('widget.title')} /> <!-- Add alt text -->
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
          <!-- Use displayed title -->
          {displayTitle}{isDemo ? ` ${$_('widget.demoSuffix')}` : ''}
        </div>
        <div class="header-buttons">
          <!-- Use translated title attribute -->
          <button id="reset-chat" on:click={resetChat} title={$_('widget.resetTitle')} aria-label={$_('widget.resetTitle')}>↺</button>
          {#if closable}
            <!-- Use translated title attribute -->
            <button id="close-chat" on:click={toggleChat} title={$_('widget.closeTitle')} aria-label={$_('widget.closeTitle')}>×</button>
          {/if}
        </div>
      </div>
      <div id="chat-messages" bind:this={chatMessages} aria-live="polite"> <!-- Add aria-live for screen readers -->
        {#each messages as message (message.sender + message.content.substring(0, 30))} <!-- Basic keying, consider UUIDs for messages if needed -->
          <div class="message {message.sender}-message">
            {@html message.content}
          </div>
          {#if message.url}
            <a href={addUtmParams(message.url, 'chat', 'chatbot', 'chatbot')}
               target={openInNewTab ? '_blank' : '_self'}
               class="cta-button">{message.ctaText}</a> <!-- ctaText already handled in addMessageToUI -->
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
          <div class="loading-container" aria-live="assertive"> <!-- aria-live for loading state -->
            <div class="loading-indicator">
              <!-- Loading message is already translated when set -->
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
          on:keydown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={isDemo ? $_('widget.placeholderDisabled') : $_('widget.placeholder')}
          disabled={isDemo || !!loadingState}
          aria-label={$_('widget.placeholder')}
        >
        <button
          id="send-button"
          disabled={isDemo || !!loadingState || !userInput.trim()}
          on:click={sendMessage}
        >
          <!-- Use translated button text -->
          {$_('widget.sendButton')}
        </button>
      </div>
      <!-- Use displayed footer text -->
      <div id="chat-footer">{displayFooterText}</div>
      {#if showPoweredBy}
        <div id="powered-by">
          <!-- Use translated "Powered by" -->
          {$_('widget.poweredBy')} <a href="https://www.autocust.it" target="_blank" rel="noopener noreferrer">Autocust</a> <!-- Add rel for security -->
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
/* Styles remain unchanged */
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
.top-left { top: 20px; left: 20px; }
.top-right { top: 20px; right: 20px; }
.bottom-left { bottom: 20px; left: 20px; }
.bottom-right { bottom: 20px; right: 20px; }

/* Fullscreen styles */
#chat-widget.fullscreen {
  top: 0; left: 0; bottom: 0; right: 0;
  width: 100vw; height: 100vh;
  z-index: 2147483647;
}
#chat-widget.fullscreen #chat-container {
  width: 100%; height: 100%;
  border-radius: 0; box-shadow: none;
}

#chat-button {
  background-color: var(--chat-btn-bg) !important;
  color: var(--chat-btn-text) !important;
  border: none; border-radius: 50%;
  width: 60px !important; height: 60px !important;
  cursor: pointer; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; margin: 0 auto;
}
#chat-button img { max-width: 100%; max-height: 100%; object-fit: cover; }

#chat-container {
  width: 340px;
  height: 485px;
  background-color: var(--container-bg);
  border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; display: flex; flex-direction: column;
}

#chat-header {
  display: flex; justify-content: space-between; align-items: center;
  background-color: var(--header-bg); color: var(--header-text);
  padding: 10px 10px 10px 14px; flex-shrink: 0;
}
.header-buttons { display: flex; gap: 5px; }
#reset-chat, #close-chat {
  background: none; border: none; color: var(--header-text);
  font-size: 20px; line-height: 20px; padding: 10px; cursor: pointer;
}

#chat-messages {
  flex-grow: 1; overflow-y: auto; padding: 10px;
  background-color: var(--messages-bg); color: var(--primary-text-color);
}
.message {
  margin-bottom: 10px; padding: 5px 10px; border-radius: 5px;
  line-height: 1.5rem; height: auto; width: auto; max-width: 80%;
  display: block; text-transform: none;
  word-wrap: break-word; /* Ensure long words break */
}
.message a { color: var(--link-color); }
:global(.message ul), :global(.message ol) { padding-inline-start: 20px; }
.user-message {
  background-color: var(--user-msg-bg); color: var(--user-msg-text);
  margin-left: auto;
}
.bot-message {
  background-color: var(--assistant-msg-bg); color: var(--assistant-msg-text);
  align-self: flex-start;
}

.loading-container {
  display: flex; align-items: center; padding: 8px 12px;
  background-color: var(--loading-bg); border-radius: 16px;
  max-width: fit-content;
  /* Removed animation: fadeInOut 2s infinite; - can be distracting */
  margin: 5px 0; /* Add some margin */
}
.loading-indicator { display: flex; align-items: baseline; gap: 4px; }
.loading-text { color: var(--loading-text-color); font-size: 14px; }
.typing-dots { display: flex; gap: 2px; padding-bottom: 2px; padding-left: 2px; }
.typing-dots span {
  width: 2px; height: 2px; background-color: var(--loading-dot-color);
  border-radius: 50%; display: inline-block; animation: customBounce 1s infinite;
}
.typing-dots span:nth-child(1) { animation-delay: 0ms; }
.typing-dots span:nth-child(2) { animation-delay: 200ms; }
.typing-dots span:nth-child(3) { animation-delay: 400ms; }

@keyframes customBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
/* @keyframes fadeInOut { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } */

@media (max-width: 480px) {
  #chat-widget:not(.fullscreen) #chat-container {
    width: 90vw; height: calc(90vh - 20px);
  }
}

#chat-input {
  display: flex; padding: 10px 10px 0 10px;
  background-color: var(--input-area-bg); flex-shrink: 0;
}
#chat-footer {
  text-align: center; font-size: 0.8rem; padding: 10px;
  background-color: var(--input-area-bg); color: var(--disclaimer-text);
  flex-shrink: 0;
}
#powered-by {
  text-align: center; font-size: 0.7rem; padding: 5px 10px 10px;
  background-color: var(--input-area-bg); color: var(--disclaimer-text);
  flex-shrink: 0;
}
#powered-by a { color: var(--disclaimer-text); text-decoration: none; }
#powered-by a:hover { text-decoration: underline; }

#user-input {
  flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 3px;
  background-color: var(--input-bg); color: var(--input-text); font-size: 16px;
}
#user-input:disabled { background-color: var(--disabled-input-bg); cursor: not-allowed; }

#send-button {
  background-color: var(--send-button-bg); color: var(--send-button-text);
  border: none; padding: 10px 15px; margin-left: 5px; cursor: pointer;
  border-radius: 3px; text-wrap: nowrap; min-width: 60px;
}
#send-button:disabled { background-color: var(--disabled-button-bg); cursor: not-allowed; opacity: 0.6; } /* Added opacity for disabled state */

.cta-button {
  display: inline-block; background-color: var(--cta-btn-bg); color: var(--cta-btn-text);
  padding: 8px 12px; border-radius: 20px; text-decoration: none;
  margin-bottom: 10px; font-size: 14px; text-align: center; width: 100%;
  box-sizing: border-box; transition: background-color 0.3s, color 0.3s;
}
.cta-button:hover { background-color: var(--cta-hover-bg); color: var(--cta-hover-text); }

:global(.product-carousel) { display: flex; overflow-x: auto; padding: 10px 0; margin-top: 10px; }
:global(.carousel-product) {
  flex: 0 0 auto; width: 150px; margin-right: 10px;
  background-color: var(--product-card-bg); border: 1px solid var(--product-border-color);
  border-radius: 5px; padding: 10px; text-align: center; color: inherit;
  display: block; transition: transform 0.2s, box-shadow 0.2s;
}
:global(.carousel-product:hover) { transform: translateY(-2px); box-shadow: 0 4px 8px var(--product-card-shadow); }
:global(.product-link) { text-decoration: none; color: inherit; display: block; position: relative; }
:global(.discount-label) {
  position: absolute; top: 0; left: -10px; background-color: #666;
  color: white; padding: 6px 10px; font-size: 12px;
}
:global(.product-link img) { width: 100%; height: 100px; object-fit: cover; margin-bottom: 5px; }
:global(.carousel-product h4) { margin: 5px 0; font-size: 14px; color: var(--primary-text-color); }
:global(.product-brand) { font-size: 12px; color: var(--disclaimer-text); margin: 5px 0; }
:global(.product-price) { margin: 5px 0; color: var(--primary-text-color); }
:global(.current-price) { font-weight: bold; font-size: 16px; }
:global(.regular-price) { text-decoration: line-through #8B0000 2px; color: inherit; font-size: 14px; margin-right: 5px; }
:global(.product-miniature__form) { margin-top: 10px; }
:global(.add-to-cart) {
  background-color: var(--cta-btn-bg); color: var(--cta-btn-text);
  border: none; border-radius: 20px; padding: 8px 12px; cursor: pointer;
  display: inline-block; /* Changed from flex to inline-block for simpler button */
  /* align-items: center; gap: 8px; */ /* Removed flex properties */
  transition: background-color 0.3s, color 0.3s; margin: 10px auto 0;
  text-decoration: none; font-size: 14px; text-align: center; width: 100%;
  box-sizing: border-box;
}
:global(.add-to-cart:hover) { background-color: var(--cta-hover-bg); color: var(--cta-hover-text); }
</style>
