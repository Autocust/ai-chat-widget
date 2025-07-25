<script>
  export let message;
  export let userMessageIcon = null;
  export let botMessageIcon = null;
  export let openInNewTab = true;

  function addUtmParams(url, source, medium, campaign) {
    if (!url || url.startsWith('#')) return url;
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
</script>

<div class="message-container {message.sender}-message">
  <div class="message">
    {#if message.sender === 'user' && userMessageIcon}
      <img src={userMessageIcon} alt="User Icon" class="message-icon user-icon" />
    {/if}
    {#if message.sender === 'bot' && botMessageIcon}
      <img src={botMessageIcon} alt="Bot Icon" class="message-icon bot-icon" />
    {/if}
    <div class="message-content">
      {@html message.content}
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
</div>

<style>
  .message-container {
    display: flex;
    flex-direction: column;
    max-width: 80%;
    margin-bottom: 10px;
  }
  .user-message {
    align-self: flex-end;
  }
  .bot-message {
    align-self: flex-start;
  }
  .message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .message-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
  .message-content {
    flex-grow: 1;
    word-wrap: break-word;
    padding: 5px 10px;
    border-radius: 5px;
  }
  .user-message .message-content {
    background-color: var(--user-msg-bg);
    color: var(--user-msg-text);
  }
  .bot-message .message-content {
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
  }
  .message-content :global(a) {
    color: var(--link-color);
  }
  :global(.message-content ul), :global(.message-content ol) {
    padding-inline-start: 20px;
  }
  .cta-button {
    display: inline-block;
    background-color: var(--cta-btn-bg);
    color: var(--cta-btn-text);
    padding: 8px 12px;
    border-radius: 20px;
    text-decoration: none;
    margin-top: 10px;
    font-size: 14px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    transition: background-color 0.3s, color 0.3s;
  }
  .cta-button:hover {
    background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
    color: var(--cta-btn-hover-text, var(--cta-hover-text));
  }
  .message-links {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
  }
</style>