<script>
  import { createEventDispatcher, getContext } from 'svelte';
  import { _ } from '../i18n';
  import { chatState } from '../utils/stores.js';

  const widgetConfig = getContext('widgetConfig');
  let inputElement;

  const dispatch = createEventDispatcher();

  function sendMessage() {
    // Blur input so mobile keyboards close after sending
    if (inputElement) {
      inputElement.blur();
    }
    dispatch('sendMessage');
  }

  function handleInput(e) {
    chatState.update(s => ({ ...s, userInput: e.target.value }));
  }

  export function focusInput() {
    inputElement.focus();
  }
</script>

<div id="chat-input">
  <input
    type="text"
    id="user-input"
    bind:this={inputElement}
    value={$chatState.userInput}
    on:keydown={(e) => e.key === 'Enter' && sendMessage()}
    on:input={handleInput}
    placeholder={widgetConfig.isDemo ? $_('widget.placeholderDisabled') : $_('widget.placeholder')}
    disabled={widgetConfig.isDemo}
    aria-label={$_('widget.placeholder')}
  >
  <button
    id="send-button"
    disabled={widgetConfig.isDemo || !!$chatState.loadingState || !$chatState.userInput.trim()}
    on:click={sendMessage}
  >{$_('widget.sendButton')}</button>
</div>

<style>
#chat-input {
  display: flex; padding: 10px 10px 0 10px;
  background-color: var(--header-bg); flex-shrink: 0;
}

#user-input {
  flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 3px;
  background-color: var(--input-bg); color: var(--input-text);
  font-size: var(--widget-font-size, 1em);
  font-size: max(16px, var(--widget-font-size, 1em));
}
#user-input:disabled { background-color: var(--disabled-input-bg); cursor: not-allowed; }

#send-button {
  background-color: var(--cta-btn-bg);
  color: var(--cta-btn-text);
  border: none;
  padding: 10px 15px;
  margin-left: 5px;
  cursor: pointer;
  border-radius: 3px;
  text-wrap: nowrap;
  min-width: 60px;
  transition: background-color 0.3s, color 0.3s;
}
#send-button:hover:not(:disabled) {
  background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
  color: var(--cta-btn-hover-text, var(--cta-hover-text));
}
#send-button:disabled {
  background-color: var(--disabled-button-bg);
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 480px) {
  #user-input {
    font-size: var(--widget-mobile-font-size, var(--widget-font-size, 16px));
    font-size: max(16px, var(--widget-mobile-font-size, var(--widget-font-size, 16px)));
  }
}
</style>
