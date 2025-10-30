<script>
  import { onMount, tick, setContext, afterUpdate } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { marked } from 'marked';
  import { io } from 'socket.io-client';
  import { _ } from './i18n'; // Import the translation function
  import { addUtmParams } from './utils/url.js';
  import { chatState } from './utils/stores.js';
  import ChatButton from './components/ChatButton.svelte';
  import ChatHeader from './components/ChatHeader.svelte';
  import Messages from './components/Messages.svelte';
  import QuickReplies from './components/QuickReplies.svelte';
  import ChatInput from './components/ChatInput.svelte';
  import ChatFooter from './components/ChatFooter.svelte';
  import DateSeparator from './components/DateSeparator.svelte';

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
  export let humanAgentMessageBgColor = '#e0e0e0';
  export let humanAgentMessageTextColor = '#000000';
  export let chatButtonBgColor = '#000000';
  export let chatButtonTextColor = '#ffffff';
  export let ctaButtonBgColor = '#f8f8f8';
  export let ctaButtonTextColor = '#000000';
  export let ctaButtonHoverBgColor = null;
  export let ctaButtonHoverTextColor = null;
  export let headerBgColor = null;
  export let headerTextColor = null;
  export let footerText = null;
  export let showPoweredBy = true;
  export let agentId = 'xyz';
  export let context = null;
  export let cms = '';
  export let persistentSession = false;
  export let sessionExpiration = 24;
  export let userMessageIcon = null; // user message icon URL
  export let assistantMessageIcon = null; // assistant message icon URL
  export let humanAgentMessageIcon = null; // human agent message icon URL
  export let buttonImageUrl = null; // custom button image URL
  export let buttonOverlayText = null;
  export let buttonOverlayDelay = 5000;
  export let predefinedQuestions = [];
  export let width = '340px';
  export let height = '485px';
  export let fontSize = '16px';
  export let zIndex = 1000;
  export let customCSS = '';
  
  setContext('widgetConfig', {
    title,
    apiUrl,
    initialMessage,
    buttonIcon,
    ctaText,
    position,
    openInNewTab,
    enableUTM,
    startOpen,
    fullScreen,
    isDemo,
    closable,
    theme,
    userMessageBgColor,
    userMessageTextColor,
    assistantMessageBgColor,
    assistantMessageTextColor,
    humanAgentMessageBgColor,
    humanAgentMessageTextColor,
    chatButtonBgColor,
    chatButtonTextColor,
    ctaButtonBgColor,
    ctaButtonTextColor,
    ctaButtonHoverBgColor,
    ctaButtonHoverTextColor,
    headerBgColor,
    headerTextColor,
    footerText,
    showPoweredBy,
    agentId,
    context,
    cms,
    persistentSession,
    sessionExpiration,
    userMessageIcon,
    assistantMessageIcon,
    humanAgentMessageIcon,
    buttonImageUrl,
    buttonOverlayText,
    buttonOverlayDelay,
    predefinedQuestions,
    width,
    height,
    fontSize,
    zIndex,
    customCSS,
  });
  
  // --- Reactive variables for props with translatable defaults ---  $: displayTitle = title ?? $_('widget.title');
  $: displayInitialMessage = initialMessage ?? $_('widget.initialMessage');
  $: displayCtaText = ctaText ?? $_('widget.ctaText');
  $: displayFooterText = footerText ?? $_('widget.footerText');

  // --- Internal State -- -
  let widgetElement;
  let messagesComponent;
  let chatInputComponent;
  let customStyleElement;
  let currentAssistantMessage = '';
  let isHumanAgentActive = false;
  let socket;
  let wsConnected = false;

  function getCustomStyleHost() {
    if (!widgetElement) return null;
    const rootNode = widgetElement.getRootNode ? widgetElement.getRootNode() : null;
    if (typeof ShadowRoot !== 'undefined' && rootNode instanceof ShadowRoot) {
      return rootNode;
    }
    return widgetElement;
  }

  function applyCustomStyles(css) {
    const trimmed = typeof css === 'string' ? css.trim() : '';
    if (!trimmed) {
      removeCustomStyles();
      return;
    }
    const host = getCustomStyleHost();
    if (!host || typeof document === 'undefined') return;
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.setAttribute('data-ai-chat-widget-custom-style', '');
    }
    if (customStyleElement.parentNode !== host) {
      customStyleElement.parentNode?.removeChild(customStyleElement);
      host.appendChild(customStyleElement);
    }
    customStyleElement.textContent = css;
  }

  function removeCustomStyles() {
    if (customStyleElement?.parentNode) {
      customStyleElement.parentNode.removeChild(customStyleElement);
    }
    customStyleElement = null;
  }

  function grow(node, { duration = 300, origin = 'center' }) {
    return {
      duration,
      css: t => {
        const eased = quintOut(t);
        return `
          transform-origin: ${origin};
          transform: scale(${eased});
          opacity: ${eased};
        `;
      }
    };
  }

  let sessionId = getSessionIdFromCookie() || generateUUID();

  function updateViewportHeight() {
    if (typeof window === 'undefined' || !widgetElement) return;
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    widgetElement.style.setProperty('--chat-viewport-height', `${height}px`);
  }

  $: transitionOrigin = position.replace('-', ' ');

  $: hasUserSentMessage = $chatState.messages.some(m => m.sender === 'user');
  $: mobileFontSize = fontSize;

  // --- Demo Content ---
  $: demoInitialMessage = $_('demo.initialMessage');
  $: demoUserMessage = $_('demo.userMessage');
  $: demoAssistantReplyText = $_('demo.botReply');
  $: demoCta = { text: $_('demo.ctaText'), url: "#product-xyz" };
  const demoProducts = [
    { id: 1, name: "Comfort Running Shoe", price: 89.99, regular_price: 110.00, image: "https://placehold.co/600x400", url: "#product-1", brand: "Brand A" },
    { id: 2, name: "Lightweight Pro Shoe", price: 120.00, regular_price: 120.00, image: "https://placehold.co/600x400", url: "#product-2", brand: "Brand B" },
    { id: 3, name: "Trail Max Shoe", price: 99.50, regular_price: 130.00, image: "https://placehold.co/600x400", url: "#product-3", brand: "Brand A" },
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
  marked.setOptions({ renderer, sanitize: false });

  // --- Local Storage Helper Functions ---
  const getLocalStorageKey = (type, id) => `chat_${type}_${id}`;

  // Reactive statement to save isHumanAgentActive to local storage
  $: if (persistentSession && !isDemo && typeof localStorage !== 'undefined') {
    try {
      const humanStatusKey = getLocalStorageKey('human_status', sessionId);
      localStorage.setItem(humanStatusKey, JSON.stringify({ isHumanAgentActive }));
    } catch (e) {
      console.error("Error saving human agent status to local storage:", e);
    }
  }

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
      const humanStatusKey = getLocalStorageKey('human_status', currentSessionId);
      const humanStatusString = localStorage.getItem(humanStatusKey);

      if (!messagesString) return null;

      const loadedMessages = JSON.parse(messagesString);
      const humanStatus = humanStatusString ? JSON.parse(humanStatusString) : { isHumanAgentActive: false };

      console.log(`Loading session ${currentSessionId} from local storage.`);
      return { messages: loadedMessages, ...humanStatus };
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
      const humanStatusKey = getLocalStorageKey('human_status', currentSessionId);
      localStorage.removeItem(metaKey);
      localStorage.removeItem(messagesKey);
      localStorage.removeItem(humanStatusKey);
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
    if (!closable && $chatState.isChatVisible) {
        return;
    }
    chatState.update(s => ({ ...s, isChatVisible: !s.isChatVisible }));
    if ($chatState.isChatVisible) {
      chatState.update(s => ({ ...s, showChatButton: false }));
      await tick();
      if (!isDemo && !wsConnected) {
        initWebSocket();
      }
      await tick();
      setTimeout(() => {
        chatInputComponent?.focusInput();
      }, 0);
    } else if (!isDemo) {
      if (socket) {
        socket.disconnect();
        wsConnected = false;
      }
    }
  }

  function initWebSocket() {
    if (isDemo) return;
    if (!apiUrl) {
        console.error("API URL is not defined. WebSocket connection cannot be established.");
        addMessageToUI($_('status.configErrorApi'), 'assistant', { persist: false });
        return;
    }

    socket = io(apiUrl + '/ws-chat', {
      path: '/ws',
      query: {
        sessionId: sessionId,
        agentId: agentId
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      wsConnected = true;
      chatState.update(s => ({ ...s, loadingState: null }));

      if (context) {
        socket.emit('context', context);
      }
    });

    socket.on('thinking', (data) => {
      chatState.update(s => ({ ...s, loadingState: { type: 'thinking', message: $_('status.thinking') } }));
    });

    socket.on('searching', (data) => {
      chatState.update(s => ({ ...s, loadingState: { type: 'searching', message: $_('status.searching') } }));
    });

    socket.on('take_over', (data) => {
      if (data.status === true) {
        isHumanAgentActive = true;
        addMessageToUI($_('status.humanAgentJoined'), 'system');
      } else {
        isHumanAgentActive = false;
        addMessageToUI($_('status.humanAgentLeft'), 'system');
        if (socket) {
          socket.disconnect();
        }
        initWebSocket();
        addMessageToUI($_('status.assistantBack'), 'system');
      }
    });

    socket.on('token', async (data) => {
      try {
        if (currentAssistantMessage === '') { // First token
          messagesComponent?.prepareForStreaming();
        }
        const content = data.content;
        chatState.update(s => ({ ...s, loadingState: { type: 'writing' } }));
        currentAssistantMessage += content;
        const sender = isHumanAgentActive ? 'human_agent' : 'assistant';
        if ($chatState.messages.length > 0 && $chatState.messages[$chatState.messages.length - 1].sender === sender) {
          const last = $chatState.messages.at(-1);
          last.content = marked.parse(currentAssistantMessage.replace(/\【.*?】/g,''));
          last.links = extractLinks(currentAssistantMessage);
          chatState.update(s => ({ ...s, messages: [...$chatState.messages] }));
          if (persistentSession && !isDemo) { // Save after updating streamed message
            saveSessionToLocalStorage(sessionId, $chatState.messages);
          }
        } else {
            addMessageToUI(currentAssistantMessage, sender); // This already calls saveSessionToLocalStorage
        }
        await tick();
        if (messagesComponent?.element) messagesComponent.element.scrollTop = messagesComponent.element.scrollHeight;
      } catch (err) {
        console.error('Error processing token:', err);
      }
    });

    socket.on('products_search', async () => {
      try {
        const products = await fetchProducts();
        if (products && products.length > 0) {
          const lastMessage = $chatState.messages[$chatState.messages.length - 1];
          if (lastMessage && lastMessage.sender === 'assistant') {
            $chatState.messages[$chatState.messages.length - 1] = { ...lastMessage, products: products };
            chatState.update(s => ({ ...s, messages: [...$chatState.messages] }));
            if (persistentSession && !isDemo) { // Save after adding carousel
                saveSessionToLocalStorage(sessionId, $chatState.messages);
            }
          }
        }
      } catch (err) {
        console.error('Error processing products_search:', err);
      }
    });

    socket.on('done', () => {
      chatState.update(s => ({ ...s, loadingState: null }));
      messagesComponent?.cleanupAfterStreaming();
      // Ensure final state of messages is saved
      if (persistentSession && !isDemo && $chatState.messages.length > 0) {
          saveSessionToLocalStorage(sessionId, $chatState.messages);
      }
      currentAssistantMessage = ''; // Reset after potential save
    });

    socket.on('error', (content) => {
      chatState.update(s => ({ ...s, loadingState: null }));
      console.error('Socket.IO error:', content);
      addMessageToUI($_('status.error'), 'assistant'); // This will save
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      wsConnected = false;
      if ($chatState.isChatVisible && reason !== 'io client disconnect') {
        chatState.update(s => ({ ...s, loadingState: { type: 'reconnecting', message: $_('status.reconnecting') } }));
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`Attempting reconnect ${attempt}/${socket.io.opts.reconnectionAttempts}`);
    });

    socket.on('reconnect_failed', () => {
      console.log('Max reconnect attempts reached.');
      chatState.update(s => ({ ...s, loadingState: null }));
      addMessageToUI($_('status.reconnectFailed'), 'assistant', { persist: false });
    });
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

  function toDateInstance(value) {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function toIsoString(date) {
    return date.toISOString();
  }

  function areDatesOnSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
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
    let processedContent;
    let links = [];
    const shouldPersistMessage = additionalData.hasOwnProperty('persist') ? additionalData.persist : true;
    const rawMarkdown = content || '';

    if (sender === 'assistant' || sender === 'human_agent') {
      links = extractLinks(rawMarkdown);
      const cleanedMarkdown = rawMarkdown.replace(/\【.*?】/g, '');
      processedContent = marked.parse(cleanedMarkdown);
    } else if (sender === 'user') { // This will apply to 'user'
      processedContent = marked.parse(rawMarkdown);
    } else if (sender === 'system') {
        processedContent = rawMarkdown;
    }

    const lastMessage = $chatState.messages.filter(m => m.type !== 'date').pop();
    const now = new Date();
    if (!lastMessage || new Date(lastMessage.date).toDateString() !== now.toDateString()) {
        chatState.update(s => ({ ...s, messages: [...s.messages, { type: 'date', date: now }] }));
    }

    chatState.update(s => ({
      ...s,
      messages: [
        ...s.messages,
        {
          content: processedContent, // Now always HTML
          sender,
          links,
          products: additionalData.products || [],
          url: additionalData.url || '',
          ctaText: additionalData.ctaText || displayCtaText,
          date: new Date()
        }
      ]
    }));

    if (persistentSession && !isDemo && shouldPersistMessage) {
      saveSessionToLocalStorage(sessionId, $chatState.messages);
    }

    tick().then(() => {
      if (messagesComponent?.element && !isDemo) {

      }
    });
  }

  function processMessagesAndAddSeparators(messageList) {
    if (!messageList || messageList.length === 0) {
        return [];
    }
    const processed = [];
    let lastDateString = null;
    messageList.forEach(msg => {
        if (msg.type === 'date') return; // Skip old separators

        const msgDate = new Date(msg.date);
        const msgDateString = msgDate.toDateString();

        if (msgDateString !== lastDateString) {
            processed.push({ type: 'date', date: msgDate });
            lastDateString = msgDateString;
        }
        processed.push(msg);
    });
    return processed;
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

  async function sendMessage() {
    if (isDemo) return;
    const message = $chatState.userInput.trim();
    if (!message || !wsConnected || $chatState.loadingState) return;

    addMessageToUI(message, 'user'); // This will save if persistentSession is true
    chatState.update(s => ({ ...s, userInput: '' }));
    chatState.update(s => ({ ...s, loadingState: { type: 'waiting' } }));
    currentAssistantMessage = ''; // Reset for the new bot message stream

    try {
      socket.emit('message', { chatInput: message });
    } catch (err) {
      console.error("Error sending message:", err);
      addMessageToUI($_('status.sendError'), 'assistant'); // This will save
      chatState.update(s => ({ ...s, loadingState: null }));
    }
    chatInputComponent?.focusInput();
  }

  function sendQuickMessage(message) {
    if (isDemo || !!$chatState.loadingState) return;
    chatState.update(s => ({ ...s, userInput: message }));
    sendMessage();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function setupDemoMessages() {
      chatState.update(s => ({ ...s, messages: [] }));
      addMessageToUI(initialMessage ?? demoInitialMessage, 'assistant');
      addMessageToUI(demoUserMessage, 'user');
      addMessageToUI(demoAssistantReplyText, 'assistant', {
          url: demoCta.url,
          ctaText: demoCta.text,
          products: demoProducts
      });
      tick().then(() => {
        if (messagesComponent?.element) {

        }
      });
  }

  async function resetChat() {
    if (isDemo) {
        setupDemoMessages();
        return;
    }

    const oldSessionId = sessionId; // Store the old ID for cleanup

    if (persistentSession && !isDemo) {
      clearSessionFromLocalStorage(oldSessionId);
    }

    // Generate a new session ID and save it
    sessionId = generateUUID();
    saveSessionIdToCookie(sessionId);

    chatState.update(s => ({ ...s, messages: [] }));
    currentAssistantMessage = '';
    chatState.update(s => ({ ...s, loadingState: null }));
    // Add initial message to the new session (this will save it to local storage with the new ID)
    addMessageToUI(displayInitialMessage, 'assistant');

    if (socket) {
      socket.disconnect();
      wsConnected = false;
    }

    try {
      // Tell the backend to reset/clean up the OLD session
      const response = await fetch(`${apiUrl}/reset-session?sessionId=${oldSessionId}`, {
        method: 'DELETE',
        headers: { 'X-Agent-ID': agentId }
      });
      if (!response.ok) console.error('Reset chat failed on backend:', await response.text());
      else console.log(`Session ${oldSessionId} reset successfully on backend.`);
    } catch (err) {
      console.error('Error sending reset chat request:', err);
    }

    // If the chat is visible, start a new WebSocket connection with the new session ID
    if ($chatState.isChatVisible) {
      initWebSocket();
    }
  }

  function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Basic check for common mobile OS and devices
    if (/android/i.test(userAgent)) {
      return true;
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return true;
    }
    // Check for common mobile screen sizes (less reliable but can be a fallback)
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      return true;
    }
    return false;
  }

  onMount(() => {
    const handleViewportChange = () => updateViewportHeight();
    updateViewportHeight();
    applyCustomStyles(customCSS);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleViewportChange);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }
    }

    chatState.update(s => ({ ...s, isChatVisible: startOpen, showChatButton: !startOpen }));

    if (isDemo) {
        setupDemoMessages();
    } else {
        saveSessionIdToCookie(sessionId); // Save/update cookie, respecting persistentSession for Max-Age

        let loadedMessagesFromStorage = false;
        if (persistentSession) {
            const storedSession = loadSessionFromLocalStorage(sessionId);
            if (storedSession) {
                if (storedSession.messages) {
                    chatState.update(s => ({ ...s, messages: processMessagesAndAddSeparators(storedSession.messages) }));
                    loadedMessagesFromStorage = true;
                }
                if (storedSession.hasOwnProperty('isHumanAgentActive')) {
                    isHumanAgentActive = storedSession.isHumanAgentActive;
                }
                // Update last activity timestamp as session is now active
                saveSessionToLocalStorage(sessionId, $chatState.messages);
            } else {
                 // Session expired or not found, ensure it's cleared (loadSession handles this)
            }
        }

        if (!loadedMessagesFromStorage && $chatState.messages.length === 0) {
            addMessageToUI(displayInitialMessage, 'assistant'); // This will also save if persistentSession is true
        }

        if (startOpen) {
            if (!wsConnected) {
                initWebSocket();
            }
        }

        // Set fullScreen to true if on mobile and not explicitly set to false
        if (!fullScreen && isMobileDevice()) {
            fullScreen = true;
            updateViewportHeight();
        }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleViewportChange);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      }
      if (!isDemo) {
          if (socket) {
              socket.disconnect();
              wsConnected = false;
          }
      }
      removeCustomStyles();
    };
  });

  afterUpdate(() => {
    applyCustomStyles(customCSS);
  });

  function renderAddToCartButton(product) {
    const buttonText = $_('product.buyButton');
    if (isDemo || !cms) {
      return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart', enableUTM)}" target="_blank" class="add-to-cart"><span>${buttonText}</span></a>`;
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
    return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart', enableUTM)}" target="${openInNewTab ? '_blank' : '_self'}" class="add-to-cart"><span>${buttonText}</span></a>`;
  }


</script>

<div
  id="chat-widget"
  bind:this={widgetElement}
  class="{position} theme-{theme}"
  class:fullscreen="{$chatState.isChatVisible && fullScreen}"
  style:--widget-font-size={fontSize}
  style:--widget-mobile-font-size={mobileFontSize}
  style:--widget-width={width}
  style:--widget-height={height}
  style:--user-msg-bg={userMessageBgColor}
  style:--user-msg-text={userMessageTextColor}
  style:--assistant-msg-bg={assistantMessageBgColor}
  style:--assistant-msg-text={assistantMessageTextColor}
  style:--human-agent-msg-bg={humanAgentMessageBgColor}
  style:--human-agent-msg-text={humanAgentMessageTextColor}
  style:--chat-btn-bg={chatButtonBgColor}
  style:--chat-btn-text={chatButtonTextColor}
  style:--cta-btn-bg={ctaButtonBgColor}
  style:--cta-btn-text={ctaButtonTextColor}
  style:--cta-btn-hover-bg={ctaButtonHoverBgColor}
  style:--cta-btn-hover-text={ctaButtonHoverTextColor}
  style:--header-bg={headerBgColor}
  style:--header-text={headerTextColor}
  style:--widget-z-index={zIndex}
>
  {#if $chatState.showChatButton || isDemo}
    <ChatButton
      isChatVisible={$chatState.isChatVisible}
      on:toggleChat={toggleChat}
    />
  {/if}

  {#if $chatState.isChatVisible}
    <div id="chat-container" transition:grow={{ duration: 300, origin: transitionOrigin }} on:outroend={() => chatState.update(s => ({ ...s, showChatButton: true }))}>
      <ChatHeader
        on:resetChat={resetChat}
        on:toggleChat={toggleChat}
      />
      <Messages
        bind:this={messagesComponent}
      />

      {#if predefinedQuestions && predefinedQuestions.length > 0}
        <QuickReplies
          on:sendQuickMessage={(e) => sendQuickMessage(e.detail)}
        />
      {/if}

      <ChatInput
        bind:this={chatInputComponent}
        on:sendMessage={sendMessage}
      />
      <ChatFooter />
    </div>
  {/if}
</div>

<style scoped>
:host {
  font-family: system-ui, Arial, sans-serif;
  color: var(--primary-text-color, #222);
  background: none;
  line-height: 1.5; /* Base line-height for the widget */
  -webkit-text-size-adjust: 100%; /* Prevent iOS auto-zoom when focusing inputs */
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Reset and establish baseline for widget elements */
#chat-widget,
#chat-widget * {
  font-family: inherit; /* Inherit from :host */
  font-size: inherit;   /* Inherit from :host, allow specific overrides */
  line-height: inherit; /* Inherit from :host or parent, allow specific overrides */
  font-weight: normal;
  font-style: normal;
  text-transform: none; /* Prevent unwanted global text transformations */
  letter-spacing: normal;
  text-shadow: none;
  box-sizing: border-box; /* Consistent box model */
}

.theme-light {
  --container-bg: #e0e0e0;
  --header-bg: #e8e8e8;
  --header-text: #000000;
  --messages-bg: #ffffff;
  --input-area-bg: #e8e8e8;
  --input-bg: #ffffff;
  --input-text: #000000;
  --disclaimer-text: #656565;
  --primary-text-color: #000000;
  --link-color: var(--primary-text-color);
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
  --disclaimer-text: #aaaaaa;
  --primary-text-color: #ffffff;
  --link-color: var(--primary-text-color);
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
  z-index: var(--widget-z-index);
  font-family: Arial, sans-serif;
  display: flex;
  gap: 10px;
  font-size: var(--widget-font-size, 16px);
  -webkit-text-size-adjust: 100%;
  --chat-viewport-height: 100dvh;
}

/* Default positioning classes */
.top-left { top: 20px; left: 20px; flex-direction: column; align-items: flex-start; }
.top-right { top: 20px; right: 20px; flex-direction: column; align-items: flex-end; }
.bottom-left { bottom: 20px; left: 20px; flex-direction: column-reverse; align-items: flex-start; }
.bottom-right { bottom: 20px; right: 20px; flex-direction: column-reverse; align-items: flex-end; }

/* Fullscreen styles */
#chat-widget.fullscreen {
  top: 0; left: 0; right: 0;
  width: 100%;
  height: var(--chat-viewport-height, 100dvh);
  max-height: var(--chat-viewport-height, 100dvh);
  z-index: 2147483647;
}
#chat-widget.fullscreen #chat-container {
  width: 100%; height: 100%;
  border-radius: 0; box-shadow: none;
}

#chat-container {
  width: var(--widget-width);
  height: var(--widget-height);
  background-color: var(--container-bg);
  border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; display: flex; flex-direction: column;
}

@media (max-width: 480px) {
  #chat-widget:not(.fullscreen) {
    font-size: var(--widget-mobile-font-size, 12px);
  }
  #chat-widget:not(.fullscreen) #chat-container {
    width: 90vw; height: calc(90vh - 20px);
  }
}

:global(.product-carousel) { display: flex; overflow-x: auto; padding: 10px 0; margin-top: 10px; }
:global(.carousel-product) {
  flex: 0 0 auto;
  width: 150px;
  margin-right: 10px;
  background-color: var(--product-card-bg);
  border: 1px solid var(--product-border-color);
  border-radius: 5px;
  padding: 10px;
  text-align: center;
  color: inherit;
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
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
  display: block;
  transition: background-color 0.3s, color 0.3s; margin: 10px auto 0;
  text-decoration: none; font-size: 14px; text-align: center; width: 100%;
  box-sizing: border-box;
}
:global(.add-to-cart:hover) {
  background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
  color: var(--cta-btn-hover-text, var(--cta-hover-text));
}
</style>
