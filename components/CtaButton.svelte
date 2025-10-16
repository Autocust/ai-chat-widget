<script>
  import { addUtmParams } from '../utils/url.js';
  import { widgetConfig } from '../utils/stores.js';

  export let url;
  export let ctaText;
</script>

<a href={addUtmParams(url, 'chat', 'chatbot', 'chatbot', $widgetConfig.enableUTM)}
   target={$widgetConfig.openInNewTab ? '_blank' : '_self'}
   class="cta-button">{ctaText}</a>

<style>
  .cta-button {
    display: block;
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
</style>
