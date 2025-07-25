<script>
  import { _ } from '../i18n';

  export let displayFooterText = '';
  export let showPoweredBy = true;
</script>

<div id="chat-footer">{displayFooterText}</div>
{#if showPoweredBy}
  <div id="powered-by">
    {$_('widget.poweredBy')} <a href="https://www.autocust.it" target="_blank" rel="noopener noreferrer">Autocust</a>
  </div>
{/if}

<style>
#chat-footer {
  text-align: center; font-size: 0.8rem; padding: 10px;
  background-color: var(--header-bg); color: var(--header-text);
  flex-shrink: 0;
}
#powered-by {
  text-align: center; font-size: 0.7rem; padding: 5px 10px 10px;
  background-color: var(--header-bg); color: var(--header-text);
  flex-shrink: 0;
}
#powered-by a { color: var(--header-text); text-decoration: none; }
#powered-by a:hover { text-decoration: underline; }
</style>