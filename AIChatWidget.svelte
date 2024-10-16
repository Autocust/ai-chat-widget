<script>
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';

  export let title = 'AI Sales Assistant';
  export let apiUrl;
  export let brandColor = '#00264c';
  export let initialMessage = 'Ciao, come posso aiutarti?';
  export let buttonIcon = '💬';
  export let position = 'bottom-right';

  let isChatVisible = false;
  let messages = [];
  let userInput = '';
  let isLoading = false;
  let chatMessages;

  const sessionId = generateUUID();

  $: colorScheme = generateColorScheme(brandColor);
  $: isImageUrl = buttonIcon.match(/\.(jpeg|jpg|gif|png)$/) != null;
  $: isSvg = buttonIcon.trim().startsWith('<svg');

  function toggleChat() {
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      tick().then(() => {
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      });
    }
  }

  function addMessage(rawText, sender) {
    let content = '';
    let productCarousel = '';
    let url = '';
    if (sender === 'bot') {
      let jsonResponse = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
      content = marked.parse(jsonResponse.response);
      url = jsonResponse.url || '';
      if (jsonResponse.products && jsonResponse.products.length > 0) {
        productCarousel = createProductCarousel(jsonResponse.products);
      }
    } else {
      content = rawText;
    }
    messages = [...messages, { content, sender, productCarousel, url }];
    tick().then(() => {
      if (sender === 'user') {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }

  function createProductCarousel(products) {
    return `
      <div class="product-carousel">
        ${products.map(product => `
          <div class="carousel-product">
            <img src="${product.immagine}" alt="${product.nome}">
            <h4>${product.nome}</h4>
            <p>${product.prezzo}</p>
            <a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot')}" target="_blank">Acquista</a>
          </div>
        `).join('')}
      </div>
    `;
  }

  function addUtmParams(url, source, medium, campaign) {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', medium);
    urlObj.searchParams.set('utm_campaign', campaign);
    return urlObj.toString();
  }

  async function sendMessage() {
    const message = userInput.trim();
    if (message) {
      addMessage(message, 'user');
      userInput = '';
      isLoading = true;

      const params = new URLSearchParams({
        sessionId: sessionId,
        action: 'sendMessage',
        chatInput: message,
      });

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await response.json();
        addMessage(data, 'bot');
      } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, there was an error processing your request.', 'bot');
      } finally {
        isLoading = false;
      }
    }
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function generateColorScheme(brandColor) {
      const r = parseInt(brandColor.slice(1, 3), 16);
      const g = parseInt(brandColor.slice(3, 5), 16);
      const b = parseInt(brandColor.slice(5, 7), 16);

      const lighterBackground = `rgba(${r}, ${g}, ${b}, 0.1)`;
      const textColor = isColorLight(brandColor) ? '#000000' : '#FFFFFF';

      // Generate a contrasting color for the button
      const buttonColor = generateContrastingColor(brandColor);
      const buttonTextColor = isColorLight(buttonColor) ? '#000000' : '#FFFFFF';

      return {
          primaryColor: brandColor,
          buttonColor: buttonColor,
          buttonTextColor: buttonTextColor,
          backgroundColor: lighterBackground,
          textColor: textColor,
          loaderColor: brandColor,
          loaderBackground: lighterBackground
      };
  }

  function isColorLight(color) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return brightness > 155;
  }

  function generateContrastingColor(color) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      // Calculate the perceived brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      let newR, newG, newB;

      if (brightness > 128) {
          // If the color is light, create a darker contrasting color
          newR = Math.max(0, r - 100);
          newG = Math.max(0, g - 100);
          newB = Math.max(0, b - 100);
      } else {
          // If the color is dark, create a lighter contrasting color
          newR = Math.min(255, r + 100);
          newG = Math.min(255, g + 100);
          newB = Math.min(255, b + 100);
      }

      // Ensure the new color has enough contrast
      const contrastRatio = getContrastRatio(r, g, b, newR, newG, newB);
      if (contrastRatio < 4.5) {
          // If contrast is not enough, adjust further
          if (brightness > 128) {
              [newR, newG, newB] = [0, 0, 0]; // Go to black for light colors
          } else {
              [newR, newG, newB] = [255, 255, 255]; // Go to white for dark colors
          }
      }

      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  function getContrastRatio(r1, g1, b1, r2, g2, b2) {
      const l1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
      const l2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
      const contrast = l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
      return contrast;
  }

  onMount(() => {
    addMessage({
      response: initialMessage,
      products: [],
      url: '',
    }, 'bot');
  });
</script>

<div id="chat-widget"
     class={position}
     style:--primary-color={colorScheme.primaryColor}
     style:--button-color={colorScheme.buttonColor}
     style:--button-text-color={colorScheme.buttonTextColor}
     style:--background-color={colorScheme.backgroundColor}
     style:--text-color={colorScheme.textColor}
     style:--loader-color={colorScheme.loaderColor}
     style:--loader-background={colorScheme.loaderBackground}>
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
        <span>{title}</span>
        <button id="close-chat" on:click={toggleChat}>×</button>
      </div>
      <div id="chat-messages" bind:this={chatMessages}>
        {#each messages as message}
          <div class="message {message.sender}-message">
            {@html message.content}
          </div>
          {#if message.url}
            <a href={addUtmParams(message.url, 'chat', 'chatbot', 'chatbot')} target="_blank" class="cta-button">FAI UN PREVENTIVO</a>
          {/if}
          {#if message.productCarousel}
            {@html message.productCarousel}
          {/if}
        {/each}
        {#if isLoading}
          <div class="loading-container">
            <div class="loading"></div>
          </div>
        {/if}
      </div>
      <div id="chat-input">
        <input type="text" id="user-input" bind:value={userInput} on:keypress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Scrivi un messaggio...">
        <button id="send-button" on:click={sendMessage}>Invia</button>
      </div>
    </div>
  {/if}
</div>

<style>
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
  background-color: var(--primary-color) !important;
  color: var(--text-color) !important;
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
}

#chat-button img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

#chat-container {
  width: 300px;
  height: 425px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#chat-header {
  background-color: var(--primary-color);
  color: var(--text-color);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#close-chat {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
}

#chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: white;
  color: var(--primary-color);
}

.message {
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  max-width: 80%;
  line-height: 1.5rem;
}

.message a {
  color: var(--primary-color);
}

.user-message {
  background-color: var(--primary-color);
  color: var(--text-color);
  margin-left: auto;
}

.bot-message {
  background-color: var(--background-color);
  color: var(--primary-color);
  align-self: flex-start;
}

.loading-container {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 10px;
}

.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid var(--loader-background);
  border-top: 3px solid var(--loader-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: relative;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

#chat-input {
  display: flex;
  padding: 10px;
  background-color: var(--primary-color);
}

#user-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: white;
  color: var(--primary-color);
  font-size: 16px;
}

#send-button {
  background-color: var(--button-color);
  color: var(--button-text-color);
  border: none;
  padding: 10px 15px;
  margin-left: 5px;
  cursor: pointer;
  border-radius: 3px;
  text-wrap: nowrap;
  min-width: 60px;
}

.cta-button {
  display: inline-block;
  background-color: var(--primary-color);
  color: var(--text-color);
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
  background-color: var(--button-color);
  color: var(--button-text-color);
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
  border: 1px solid var(--primary-color);
  border-radius: 5px;
  padding: 10px;
  text-align: center;
}

:global(.carousel-product img) {
  width: 100%;
  height: 100px;
  object-fit: cover;
  margin-bottom: 5px;
}

:global(.carousel-product h4) {
  margin: 5px 0;
  font-size: 14px;
  color: var(--primary-color);
}

:global(.carousel-product p) {
  margin: 5px 0;
  font-weight: bold;
  color: var(--primary-color);
}

:global(.carousel-product a) {
  background-color: var(--primary-color);
  color: var(--text-color);
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  text-decoration: none;
  display: inline-block;
  margin-top: 10px;
}
</style>