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

<div class="message {message.sender}-message">
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

<style>
.message {
  margin-bottom: 10px; /* padding and border-radius removed */
  height: auto; width: auto; max-width: 80%;
  display: flex; /* MODIFIED for icon layout */
  align-items: flex-start; /* Vertically align icon and text */
  gap: 8px; /* Space between icon and text */
}

.message-icon {
  width: 32px; /* Adjust as needed */
  height: 32px; /* Adjust as needed */
  flex-shrink: 0; /* Prevent icon from shrinking */
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
  margin-left: auto;
}
.user-message .message-content {
  background-color: var(--user-msg-bg);
  color: var(--user-msg-text);
}
.bot-message {
  align-self: flex-start;
}
.bot-message .message-content {
  background-color: var(--assistant-msg-bg);
  color: var(--assistant-msg-text);
}

.cta-button {
  display: inline-block;
  background-color: var(--cta-btn-bg);
  color: var(--cta-btn-text);
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
  background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
  color: var(--cta-btn-hover-text, var(--cta-hover-text));
}
</style>