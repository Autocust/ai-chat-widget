<script>
  import CtaButton from './CtaButton.svelte';

  export let message;
  export let userMessageIcon = null;
  export let botMessageIcon = null;
  export let openInNewTab = true;
  export let enableUTM = true;
</script>

<div class="message-container {message.sender}-message {message.url || (message.links && message.links.length > 0) ? 'has-cta' : ''}">
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
    <CtaButton url={message.url} ctaText={message.ctaText} {openInNewTab} {enableUTM} />
  {/if}
  {#if message.links && message.links.length > 0}
    <div class="message-links">
      {#each message.links as link}
        <CtaButton url={link.url} ctaText={link.text} {openInNewTab} {enableUTM} />
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
    margin-bottom: 10px;
    min-width: 50%;
  }

  .message-container.has-cta {
    max-width: 100%; /* Allow full width for messages with CTA buttons */
  }

  
  .user-message {
    margin-left: auto;
  }
  .bot-message {
    margin-right: auto;
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
  
  .message-links {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
  }
</style>