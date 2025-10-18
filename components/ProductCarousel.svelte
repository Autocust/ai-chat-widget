<script>
  import { getContext } from 'svelte';
  import { addUtmParams } from '../utils/url.js';
  import { _ } from '../i18n';

  const widgetConfig = getContext('widgetConfig');
  export let products = [];

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

  function renderAddToCartButton(product) {
    const buttonText = $_('product.buyButton');
    if (widgetConfig.isDemo || !widgetConfig.cms) {
      return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart', widgetConfig.enableUTM)}" target="_blank" class="add-to-cart"><span>${buttonText}</span></a>`;
    }
    if (widgetConfig.cms === 'prestashop') {
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
    return `<a href="${addUtmParams(product.url, 'chat', 'chatbot', 'chatbot_add_to_cart', widgetConfig.enableUTM)}" target="${widgetConfig.openInNewTab ? '_blank' : '_self'}" class="add-to-cart"><span>${buttonText}</span></a>`;
  }
</script>

<div class="product-carousel">
  {#each products as product}
    <div class="carousel-product">
      <a href={addUtmParams(product.url, 'chat', 'chatbot', 'chatbot', widgetConfig.enableUTM)}
         target={widgetConfig.openInNewTab ? '_blank' : '_self'}
         class="product-link">
        {#if product.regular_price && product.regular_price > product.price}
          <span class="discount-label">{calculateDiscount(product.price, product.regular_price)}</span>
        {/if}
        <img src={product.image} alt={product.name}>
        {#if product.brand}
          <div class="product-brand">{product.brand}</div>
        {/if}
        <h4>{product.name}</h4>
        <div class="product-price">
          {#if product.regular_price && product.regular_price !== product.price}
            <span class="regular-price">{formatPrice(product.regular_price)}</span>
          {/if}
          <span class="current-price">{formatPrice(product.price)}</span>
        </div>
      </a>
      {@html renderAddToCartButton(product)}
    </div>
  {/each}
</div>
