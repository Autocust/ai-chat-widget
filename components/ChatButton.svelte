<script>
  import { createEventDispatcher, onMount, getContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { _ } from '../i18n';
  import { chatState } from '../utils/stores.js';

  const widgetConfig = getContext('widgetConfig');

  let isOverlayVisible = false;
  let overlayTimeout;

  $: isImageUrl = widgetConfig.buttonIcon && widgetConfig.buttonIcon.match(/\.(jpeg|jpg|gif|png)$/) != null;
  $: isSvg = widgetConfig.buttonIcon && widgetConfig.buttonIcon.trim().startsWith('<svg');

  const dispatch = createEventDispatcher();

  function toggleChat() {
    if (isOverlayVisible && !widgetConfig.isDemo) {
      isOverlayVisible = false;
      clearTimeout(overlayTimeout);
    }
    dispatch('toggleChat');
  }

  onMount(() => {
    if (widgetConfig.buttonOverlayText && (!$chatState.isChatVisible || widgetConfig.isDemo)) {
      isOverlayVisible = true;
      if (!widgetConfig.isDemo) {
        overlayTimeout = setTimeout(() => {
          isOverlayVisible = false;
        }, parseInt(widgetConfig.buttonOverlayDelay, 10) || 5000);
      }
    }

    return () => {
      clearTimeout(overlayTimeout);
    };
  });
</script>

<div class="button-wrapper">
  {#if isOverlayVisible && widgetConfig.buttonOverlayText && (!$chatState.isChatVisible || widgetConfig.isDemo)}
    <div class="button-overlay" transition:fade={{ duration: 300 }}>
      {widgetConfig.buttonOverlayText}
      <div class="button-overlay-tail"></div>
    </div>
  {/if}

  {#if widgetConfig.buttonImageUrl}
    <button
      class="custom-chat-button-wrapper"
      on:click={toggleChat}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleChat()}
      aria-label={$_('widget.title')}
      tabindex="0"
    >
      <img
        src={widgetConfig.buttonImageUrl}
        alt=""
        class="custom-chat-button-image"
      />
    </button>
  {:else}
    <button id="chat-button" on:click={toggleChat} aria-label={$_('widget.title')}>
      {#if isImageUrl}
        <img src={widgetConfig.buttonIcon} alt="" /> <!-- Decorative icon, button has aria-label -->
      {:else if isSvg}
        {@html widgetConfig.buttonIcon}
      {:else}
        {@html widgetConfig.buttonIcon}
      {/if}
    </button>
  {/if}
</div>

<style>
.button-wrapper {
  position: relative;
}

.button-overlay {
  position: absolute;
  background-color: var(--messages-bg);
  color: var(--primary-text-color);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  width: max-content;
  max-width: 220px;
  font-size: 14px;
  line-height: 1.4;
  z-index: 1;
  bottom: 50%;
  transform: translateY(50%);
}

.button-overlay-tail {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  top: 50%;
  transform: translateY(-50%);
}

/* Positioning for overlay and tail based on widget position */
:global(.bottom-right) .button-overlay, :global(.top-right) .button-overlay {
  right: calc(100% + 15px);
}
:global(.bottom-right) .button-overlay-tail, :global(.top-right) .button-overlay-tail {
  left: 100%;
  border-width: 8px 0 8px 8px;
  border-color: transparent transparent transparent var(--messages-bg);
}

:global(.bottom-left) .button-overlay, :global(.top-left) .button-overlay {
  left: calc(100% + 15px);
}
:global(.bottom-left) .button-overlay-tail, :global(.top-left) .button-overlay-tail {
  right: 100%;
  border-width: 8px 8px 8px 0;
  border-color: transparent var(--messages-bg) transparent transparent;
}


#chat-button {
  background-color: var(--chat-btn-bg) !important;
  color: var(--chat-btn-text) !important;
  border: none; border-radius: 50%;
  width: 60px !important; height: 60px !important;
  cursor: pointer; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
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
</style>