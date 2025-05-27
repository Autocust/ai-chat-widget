<script>
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import { _ } from './i18n'; // Import the translation function

  // --- Props ---
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
  export let persistentSession = false;
  export let sessionExpiration = 24;
  export let userMessageIcon = null; // user message icon URL
  export let botMessageIcon = null; // bot message icon URL
  export let buttonImageUrl = null; // custom button image URL

  // --- Reactive variables for props with translatable defaults ---
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
  $: demoInitialMessage = $_('demo.initialMessage');
  $: demoUserMessage = $_('demo.userMessage');
  $: demoBotReplyText = $_('demo.botReply');
  $: demoCta = { text: $_('demo.ctaText'), url: "#product-xyz" };
  const demoProducts = [
    { id: 1, name: "Comfort Running Shoe", price: 89.99, regular_price: 110.00, image: "https://fakeimg.pl/600x400", url: "#product-1", brand: "Brand A" },
    { id: 2, name: "Lightweight Pro Shoe", price: 120.00, regular_price: 120.00, image: "https://fakeimg.pl/600x400", url: "#product-2", brand: "Brand B" },
    { id: 3, name: "Trail Max Shoe", price: 99.50, regular_price: 130.00, image: "https://fakeimg.pl/600x400", url: "#product-3", brand: "Brand A" },
  ];
  // --- End Demo Content ---

  const renderer = new marked.Renderer();
  renderer.link = function(href, title, text) {
    const link = marked.Renderer.prototype.link.call(this, href, title, text);
    if (openInNewTab) {
      return link.replace('<a ', '<a target="_blank" ');
    }
    return link.replace('<a ', '<a target="_self" ');
  };
  marked.setOptions({ renderer });

  // --- Local Storage Helper Functions ---
  const getLocalStorageKey = (type, id) => `chat_${type}_${id}`;

  function loadSessionFromLocalStorage(currentSessionId) {
    if (typeof localStorage === 'undefined' || !persistentSession || isDemo) return null;
    try {
      const metaKey = getLocalStorageKey('meta', currentSessionId);
      const messagesKey = getLocalStorageKey('messages', currentSessionId);

      const metaString = localStorage.getItem(metaKey);
      if (!metaString) return null;

      const meta = JSON.parse(metaString);
      const expirationHours = parseFloat(sessionExpiration) || 24;
      const sessionAgeHours = (Date.now() - meta.lastActivity) / (1000 * 60 * 60);

      if (sessionAgeHours > expirationHours) {
        console.log(`Session ${currentSessionId} expired. Clearing from local storage.`);
        clearSessionFromLocalStorage(currentSessionId);
        return null;
      }

      const messagesString = localStorage.getItem(messagesKey);
      if (!messagesString) return null;

      console.log(`Loading session ${currentSessionId} from local storage.`);
      return { messages: JSON.parse(messagesString) };
    } catch (e) {
      console.error("Error loading session from local storage:", e);
      clearSessionFromLocalStorage(currentSessionId); // Clear potentially corrupted data
      return null;
    }
  }

  function saveSessionToLocalStorage(currentSessionId, currentMessages) {
    if (typeof localStorage === 'undefined' || !persistentSession || isDemo) return;
    try {
      const metaKey = getLocalStorageKey('meta', currentSessionId);
      const messagesKey = getLocalStorageKey('messages', currentSessionId);

      const meta = { lastActivity: Date.now() };
      localStorage.setItem(metaKey, JSON.stringify(meta));
      localStorage.setItem(messagesKey, JSON.stringify(currentMessages));
      // console.log(`Session ${currentSessionId} saved to local storage.`);
    } catch (e) {
      console.error("Error saving session to local storage:", e);
    }
  }

  function clearSessionFromLocalStorage(currentSessionId) {
    if (typeof localStorage === 'undefined' || !persistentSession || isDemo) return;
    try {
      const metaKey = getLocalStorageKey('meta', currentSessionId);
      const messagesKey = getLocalStorageKey('messages', currentSessionId);
      localStorage.removeItem(metaKey);
      localStorage.removeItem(messagesKey);
      console.log(`Session ${currentSessionId} cleared from local storage.`);
    } catch (e) {
      console.error("Error clearing session from local storage:", e);
    }
  }

  function getSessionIdFromCookie() {
    const cookieName = `aisa_agent_${agentId}`;
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function saveSessionIdToCookie(sessionIdValue) {
    let cookieString = `aisa_agent_${agentId}=${sessionIdValue};path=/;SameSite=Lax`;
    if (persistentSession && !isDemo) {
      const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 days
      cookieString += `;Max-Age=${maxAgeSeconds}`;
    }
    document.cookie = cookieString;
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
        addMessageToUI($_('status.configErrorApi'), 'bot', { persist: false });
        return;
    }
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    ws = new WebSocket(`${wsUrl}/ws-chat?sessionId=${sessionId}&agentId=${encodeURIComponent(agentId)}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      wsConnected = true;
      isReconnecting = false;
      reconnectAttempt = 0;
      loadingState = null;
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch(data.type) {
          case 'thinking':
            loadingState = { type: 'thinking', message: $_('status.thinking') };
            break;
          case 'searching':
            loadingState = { type: 'searching', message: $_('status.searching') };
            break;
          case 'token':
            loadingState = { type: 'writing' };
            currentBotMessage += data.content;
            if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
              const last = messages.at(-1);
              last.content = marked.parse(currentBotMessage.replace(/\【.*?】/g,''));
              last.links = extractLinks(currentBotMessage);
              messages = [...messages];
              if (persistentSession && !isDemo) { // Save after updating streamed message
                saveSessionToLocalStorage(sessionId, messages);
              }
            } else {
               addMessageToUI(currentBotMessage, 'bot'); // This already calls saveSessionToLocalStorage
            }
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
                messages[messages.length - 1] = { ...lastMessage, productCarousel: carousel };
                messages = [...messages];
                if (persistentSession && !isDemo) { // Save after adding carousel
                    saveSessionToLocalStorage(sessionId, messages);
                }
              }
            }
            break;
          case 'done':
            loadingState = null;
            // Ensure final state of messages is saved
            if (persistentSession && !isDemo && messages.length > 0) {
                saveSessionToLocalStorage(sessionId, messages);
            }
            currentBotMessage = ''; // Reset after potential save
            break;
          case 'error':
            loadingState = null;
            console.error('WebSocket error:', data.content);
            addMessageToUI($_('status.error'), 'bot'); // This will save
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
        addMessageToUI($_('status.connectionError'), 'bot', { persist: false });
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      wsConnected = false;
      if (isChatVisible && event.code !== 1000 && !isReconnecting) {
        attemptReconnect();
      } else {
          isReconnecting = false;
          loadingState = null;
      }
    };
  }

  function attemptReconnect() {
    if (isDemo || isReconnecting || reconnectAttempt >= maxReconnectAttempts) return;
    isReconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 16000);
    loadingState = {
      type: 'reconnecting',
      message: $_('status.reconnecting', { values: { current: reconnectAttempt + 1, max: maxReconnectAttempts } })
    };
    console.log(`Attempting reconnect ${reconnectAttempt + 1}/${maxReconnectAttempts} in ${delay}ms`);
    clearTimeout(reconnectInterval);
    reconnectInterval = setTimeout(() => {
      if (!isChatVisible || wsConnected) {
          isReconnecting = false;
          loadingState = null;
          console.log(`Reconnect aborted: Chat closed or already connected.`);
          return;
      }
      reconnectAttempt++;
      if (reconnectAttempt > maxReconnectAttempts) {
        loadingState = null;
        addMessageToUI($_('status.reconnectFailed'), 'bot', { persist: false });
        isReconnecting = false;
        console.log('Max reconnect attempts reached.');
        return;
      }
      try {
        console.log(`Executing reconnect attempt ${reconnectAttempt}`);
        loadingState = {
            type: 'reconnecting',
            message: $_('status.reconnecting', { values: { current: reconnectAttempt, max: maxReconnectAttempts } })
        };
        initWebSocket();
      } catch (err) {
        console.error('Reconnection failed immediately during initWebSocket:', err);
        isReconnecting = false;
        loadingState = null;
        addMessageToUI($_('status.reconnectFailed'), 'bot');
      }
    }, delay);
  }

  function createProductCarousel(products) {
    if (!products || products.length === 0) return '';
    const productCards = products.map(product => `
      <div class="carousel-product">
        <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot')}"
           target="${openInNewTab ? '_blank' : '_self'}"
           class="product-link">
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
      return (await response.json()).products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return null;
    }
  }

  function addMessageToUI(content, sender, additionalData = {}) {
    let processedContent = content; // This is the content that will be stored/displayed
    let links = [];
    const shouldPersistMessage = additionalData.hasOwnProperty('persist') ? additionalData.persist : true;

    if (sender === 'bot') {
      const rawMarkdown = content || '';
      links = extractLinks(rawMarkdown); // Extract links from original markdown
      // Process markdown: first remove unwanted patterns, then parse
      const cleanedMarkdown = rawMarkdown.replace(/\【.*?】/g, '');
      processedContent = marked.parse(cleanedMarkdown);
    }
    // For user messages, processedContent remains plain text (original content).

    messages = [...messages, {
      content: processedContent, // HTML for bot, plain text for user
      sender,
      links,
      productCarousel: additionalData.productCarousel || '',
      url: additionalData.url || '',
      ctaText: additionalData.ctaText || displayCtaText
    }];

    if (persistentSession && !isDemo && shouldPersistMessage) {
      saveSessionToLocalStorage(sessionId, messages);
    }

    tick().then(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function formatPrice(price) {
     try {
        const locale = navigator.language || 'en';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(price);
     } catch (e) {
        console.warn("Intl.NumberFormat failed, falling back to basic format.", e);
        return `€${Number(price).toFixed(2)}`;
     }
  }

  function calculateDiscount(price, regularPrice) {
    if (!regularPrice || regularPrice <= price) return null;
    const discount = ((regularPrice - price) / regularPrice) * 100;
    return `-${Math.round(discount)}%`;
  }

  function addUtmParams(url, source, medium, campaign) {
    if (!enableUTM || !url || url.startsWith('#')) return url;
    try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('utm_source', source);
        urlObj.searchParams.set('utm_medium', medium);
        urlObj.searchParams.set('utm_campaign', campaign);
        return urlObj.toString();
    } catch (e) {
        console.warn("Could not add UTM params to invalid URL:", url, e);
        return url;
    }
  }

  async function sendMessage() {
    if (isDemo) return;
    const message = userInput.trim();
    if (!message || !wsConnected || loadingState) return;

    addMessageToUI(message, 'user'); // This will save if persistentSession is true
    userInput = '';
    loadingState = { type: 'thinking', message: $_('status.thinking') };
    currentBotMessage = ''; // Reset for the new bot message stream

    try {
      ws.send(JSON.stringify({ chatInput: message }));
    } catch (err) {
      console.error("Error sending message:", err);
      addMessageToUI($_('status.sendError'), 'bot'); // This will save
      loadingState = null;
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
      addMessageToUI(demoInitialMessage, 'bot');
      addMessageToUI(demoUserMessage, 'user');
      const demoCarouselHtml = createProductCarousel(demoProducts);
      addMessageToUI(demoBotReplyText, 'bot', {
          url: demoCta.url,
          ctaText: demoCta.text,
          productCarousel: demoCarouselHtml
      });
      tick().then(() => {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      });
  }

  async function resetChat() {
    if (isDemo) {
        setupDemoMessages();
        return;
    }

    if (persistentSession && !isDemo) {
      clearSessionFromLocalStorage(sessionId);
    }

    messages = [];
    currentBotMessage = '';
    loadingState = null;
    addMessageToUI(displayInitialMessage, 'bot'); // This will also save the new session if persistent
    tick().then(() => {
        if (chatMessages) chatMessages.scrollTop = 0;
    });

    if (ws) {
      ws.close(1000, 'Session reset');
      wsConnected = false;
    }
    clearTimeout(reconnectInterval);
    isReconnecting = false;
    reconnectAttempt = 0;

    try {
      const response = await fetch(`${apiUrl}/reset-session?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: { 'X-Agent-ID': agentId }
      });
      if (!response.ok) console.error('Reset chat failed on backend:', await response.text());
      else console.log('Session reset successfully on backend.');
    } catch (err) {
      console.error('Error sending reset chat request:', err);
    }

    if (isChatVisible) {
      initWebSocket();
    }
  }

  onMount(() => {
    if (isDemo) {
        setupDemoMessages();
    } else {
        saveSessionIdToCookie(sessionId); // Save/update cookie, respecting persistentSession for Max-Age

        let loadedMessagesFromStorage = false;
        if (persistentSession) {
            const storedSession = loadSessionFromLocalStorage(sessionId);
            if (storedSession && storedSession.messages) {
                messages = storedSession.messages;
                loadedMessagesFromStorage = true;
                // Update last activity timestamp as session is now active
                saveSessionToLocalStorage(sessionId, messages);
                tick().then(() => {
                    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
                });
            } else {
                 // Session expired or not found, ensure it's cleared (loadSession handles this)
            }
        }

        if (!loadedMessagesFromStorage && messages.length === 0) {
            addMessageToUI(displayInitialMessage, 'bot'); // This will also save if persistentSession is true
        }

        if (startOpen) {
            if (!wsConnected && !isReconnecting) {
                initWebSocket();
            }
        }
    }

    return () => {
      if (!isDemo) {
          if (ws) {
              ws.close(1000, 'Component unmounted');
              wsConnected = false;
          }
          clearTimeout(reconnectInterval);
          isReconnecting = false;
      }
    };
  });

  function renderAddToCartButton(product) {
    const buttonText = $_('product.buyButton');
    if (isDemo || !cms) {
      return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart')}" target="_blank" class="add-to-cart"><span>${buttonText}</span></a>`;
    }
    if (cms === 'prestashop') {
      return `
        <form class="product-miniature__form" action="/carrello" method="post">
          <input type="hidden" name="id_product" value="${product.id}">
          <input type="hidden" name="id_product_attribute" value="${product.id_product_attribute || 0}">
          <input type="hidden" name="qty" value="1" class="form-control input-qty">
          <input type="hidden" name="token" value="${window.prestashop?.static_token || ''}">
          <input type="hidden" name="add" value="1">
          <button class="btn add-to-cart" data-button-action="add-to-cart" type="submit"><span>${buttonText}</span></button>
        </form>`;
    }
    return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart')}" target="${openInNewTab ? '_blank' : '_self'}" class="add-to-cart"><span>${buttonText}</span></a>`;
  }
</script>

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
    {#if buttonImageUrl}
      <button
        class="custom-chat-button-wrapper"
        on:click={toggleChat}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleChat()}
        aria-label={$_('widget.title')}
        tabindex="0"
      >
        <img
          src={buttonImageUrl}
          alt=""
          class="custom-chat-button-image"
        />
      </button>
    {:else}
      <button id="chat-button" on:click={toggleChat} aria-label={$_('widget.title')}>
        {#if isImageUrl}
          <img src={buttonIcon} alt="" /> <!-- Decorative icon, button has aria-label -->
        {:else if isSvg}
          {@html buttonIcon}
        {:else}
          {@html buttonIcon}
        {/if}
      </button>
    {/if}
  {/if}

  {#if isChatVisible}
    <div id="chat-container">
      <div id="chat-header">
        <div>{displayTitle}{isDemo ? ` ${$_('widget.demoSuffix')}` : ''}</div>
        <div class="header-buttons">
          <button id="reset-chat" on:click={resetChat} title={$_('widget.resetTitle')} aria-label={$_('widget.resetTitle')}>↺</button>
          {#if closable}
            <button id="close-chat" on:click={toggleChat} title={$_('widget.closeTitle')} aria-label={$_('widget.closeTitle')}>×</button>
          {/if}
        </div>
      </div>
      <div id="chat-messages" bind:this={chatMessages} aria-live="polite">
        {#each messages as message (message.sender + message.content.substring(0, 30) + Math.random())} <!-- Consider more robust keying if issues arise -->
          <div class="message {message.sender}-message">
            {#if message.sender === 'user' && userMessageIcon}
              <img src={userMessageIcon} alt="User Icon" class="message-icon user-icon" />
            {/if}
            {#if message.sender === 'bot' && botMessageIcon}
              <img src={botMessageIcon} alt="Bot Icon" class="message-icon bot-icon" />
            {/if}
            <div class="message-content">
              {#if message.sender === 'bot'}
                {@html message.content}
              {:else}
                {message.content} <!-- Render user messages as text -->
              {/if}
            </div>
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
                  class="cta-button">{link.text}</a>
              {/each}
            </div>
          {/if}
          {#if message.productCarousel}
            {@html message.productCarousel}
          {/if}
        {/each}
        {#if !isDemo && loadingState?.message}
          <div class="loading-container" aria-live="assertive">
            <div class="loading-indicator">
              <span class="loading-text">{loadingState.message}</span>
              <div class="typing-dots"><span></span><span></span><span></span></div>
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
        >{$_('widget.sendButton')}</button>
      </div>
      <div id="chat-footer">{displayFooterText}</div>
      {#if showPoweredBy}
        <div id="powered-by">
          {$_('widget.poweredBy')} <a href="https://www.autocust.it" target="_blank" rel="noopener noreferrer">Autocust</a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
:host {
  font-family: system-ui, Arial, sans-serif;
  font-size: 16px;
  color: var(--primary-text-color, #222);
  background: none;
}

/* Ensure all text and links inherit the main color unless overridden */
#chat-widget,
#chat-widget * {
  color: inherit;
}
#chat-widget a,
#chat-widget .cta-button,
#chat-widget .add-to-cart {
  color: inherit;
}

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
  --product-card-bg: #ffffff;
  --product-card-shadow: rgba(0, 0, 0, 0.1);
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
  --product-card-bg: #3a3a3a;
  --product-card-shadow: rgba(255, 255, 255, 0.1);
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

.custom-chat-button-wrapper {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-block; /* Adjust if needed, e.g., to match #chat-button's display */
  line-height: 0; /* Helps remove extra space if image is inline-block */
}

.custom-chat-button-image {
  width: 60px; /* Default width, similar to original button */
  height: 60px; /* Default height, similar to original button */
  /* cursor: pointer; /* Moved to wrapper button */
  display: block;
  object-fit: cover; /* To maintain aspect ratio if image is not square */
  border-radius: 0; /* Default, can be overridden by user's image or further CSS */
}

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
  margin-bottom: 10px; /* padding and border-radius removed */
  line-height: 1.5rem; height: auto; width: auto; max-width: 80%;
  display: flex; /* MODIFIED for icon layout */
  align-items: flex-start; /* Vertically align icon and text */
  gap: 8px; /* Space between icon and text */
  text-transform: none;
}

.message-icon {
  width: 32px; /* Adjust as needed */
  height: 32px; /* Adjust as needed */
  flex-shrink: 0; /* Prevent icon from shrinking */
  /* border-radius: 50%; /* Uncomment for circular icons */
}

.message-content {
  flex-grow: 1; /* Allow content to take available space */
  word-wrap: break-word; /* Ensure long words break */
  padding: 5px 10px; /* Added padding */
  border-radius: 5px; /* Added border-radius */
}

.message a { color: var(--link-color); }
:global(.message ul), :global(.message ol) { padding-inline-start: 20px; }
.user-message {
  /* background-color and color removed */
  margin-left: auto;
}
.user-message .message-content {
  background-color: var(--user-msg-bg);
  color: var(--user-msg-text);
}
.bot-message {
  /* background-color and color removed */
  align-self: flex-start;
}
.bot-message .message-content {
  background-color: var(--assistant-msg-bg);
  color: var(--assistant-msg-text);
}

.loading-container {
  display: flex; align-items: center; padding: 8px 12px;
  background-color: var(--loading-bg); border-radius: 16px;
  max-width: fit-content;
  margin: 5px 0;
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
#send-button:disabled { background-color: var(--disabled-button-bg); cursor: not-allowed; opacity: 0.6; }

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
  display: inline-block;
  transition: background-color 0.3s, color 0.3s; margin: 10px auto 0;
  text-decoration: none; font-size: 14px; text-align: center; width: 100%;
  box-sizing: border-box;
}
:global(.add-to-cart:hover) { background-color: var(--cta-hover-bg); color: var(--cta-hover-text); }
</style>
