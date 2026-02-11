# AI Chat Widget

This project provides a versatile, embeddable chat widget for the [Autocust](https://www.autocust.it) AI sales assistant.

## Features

- **Customizable**: Easily customize the chat widget's appearance and behavior to match your brand's style.
- **Embeddable**: Simple to embed and integrate into your website.
- **Responsive**: Works seamlessly on all devices.
- **Intelligent**: Utilizes advanced AI models to provide intelligent responses.
- **Demo Mode**: Includes a demo mode to showcase widget features without connecting to the backend.

## Quick Start

To use the AI Chat Widget on your website, add the following script tag anywhere within the `<body>` of your HTML page:

```html
<script
    src="https://cdn.jsdelivr.net/gh/Autocust/ai-chat-widget@latest/dist/chat-widget.min.js"
    data-title="My Custom Assistant"
    data-api-url="https://your-api-endpoint.com"
    data-theme="dark"
    data-user-message-bg-color="#3a3a3a"
    data-chat-button-bg-color="#5a5a5a"
    data-initial-message="How can I help you today?"
    data-button-icon="🤖"
    data-button-overlay-text="Have a question? Ask me!"
    data-button-overlay-delay="5000"
    data-predefined-questions='["What are your shipping times?", "Do you have any discounts?"]'
    data-position="bottom-right"
    data-cta-text="Chiedi informazioni"
    data-cta-button-hover-bg-color="#ff0000"
    data-cta-button-hover-text-color="#ffffff"
    data-open-in-new-tab="true"
    data-start-open="false"
    data-full-screen="false"
    data-width="350px"
    data-height="500px"
    data-is-demo="false"
    data-closable="true"
    data-header-bg-color="#00529b"
    data-header-text-color="#ffffff"
    data-z-index="1000"
></script>
```

## Available options:

- `data-title`: The title of the chat widget. If not set, a default localized title is used (e.g., "Chat with us" in English).
- `data-api-url`: The URL of the API that will power the chat widget. Ignored if `data-is-demo` is `true`. Default is `null`.
- `data-initial-message`: The initial message displayed by the chat widget. Used in normal mode and as the first message in demo mode. If not set, a default localized message is used (e.g., "Hello! How can I help you today?" in English).
- `data-button-icon`: The icon for the chat toggle button (can be text, emoji, URL to image, or SVG markup). Default is `💬`.
- `data-button-overlay-text`: Text for a notification bubble that appears next to the chat button on page load to attract attention. It disappears after a delay. If not set, no overlay is shown.
- `data-button-overlay-delay`: The time in milliseconds for the button overlay to be visible before fading out. Default is `5000` (5 seconds).
- `data-predefined-questions`: A JSON-formatted array of strings to display as clickable suggestions for the user. These suggestions are only shown before the user sends their first message. Example: `data-predefined-questions='["Question 1?", "Question 2?"]'`.
- `data-cta-text`: The default text for the call-to-action button in the chat widget (can be overridden by bot messages or demo content). If not set, a default localized text is used (e.g., "Ask for information" in English).
- `data-open-in-new-tab`: A boolean value to determine if URLs should open in a new tab. Default is `true`.
- `data-enable-utm`: Set to `true` to include UTM parameters in product URLs. Set to `false` to disable UTM parameters. Default is `true`.
- `data-position`: The position of the chat widget (see "Supported Positions" below). Ignored if `data-full-screen` is `true`. Default is `bottom-right`.
- `data-persistent-session`: Set to `true` to enable persistent sessions, allowing users to retain their chat history across sessions. Default is `false`. Ignored if `data-is-demo` is `true`.
- `data-session-expiration`: The duration (in hours) for which the session is valid. After this period, the chat history will be wiped. Default is `24`. Ignored if `data-is-demo` is `true`.
- `data-theme`: The overall theme ('light' or 'dark'). Default is `light`.
- `data-user-message-bg-color`: Background color for user messages (e.g., '#e0e0e0'). Default is `#e0e0e0`.
- `data-user-message-text-color`: Text color for user messages (e.g., '#000000'). Default is `#000000`.
- `data-assistant-message-bg-color`: Background color for assistant messages (e.g., '#f8f8f8'). Default is `#f8f8f8`.
- `data-assistant-message-text-color`: Text color for assistant messages (e.g., '#000000'). Default is `#000000`.
- `data-chat-button-bg-color`: Background color for the chat toggle button (e.g., '#000000'). Default is `#000000`.
- `data-chat-button-text-color`: Text/icon color for the chat toggle button (e.g., '#ffffff'). Default is `#ffffff`.
- `data-cta-button-bg-color`: Background color for Call-To-Action buttons below messages (e.g., '#f8f8f8'). Default is `#f8f8f8`.
- `data-cta-button-text-color`: Text color for Call-To-Action buttons below messages (e.g., '#000000'). Default is `#000000`.
- `data-cta-button-hover-bg-color`: Background color for Call-To-Action buttons on hover. Overrides the theme's default hover background.
- `data-cta-button-hover-text-color`: Text color for Call-To-Action buttons on hover. Overrides the theme's default hover text color.
- `data-header-bg-color`: Background color for the chat header. Overrides the theme's default header background.
- `data-header-text-color`: Text color for the chat header title and buttons. Overrides the theme's default header text color.
- `data-footer-text`: Custom text displayed in the footer area below the input field. If not set, a default localized message is used (e.g., "AI-generated. Please verify important information." in English).
- `data-show-powered-by`: Set to `false` to hide the "Powered by Autocust" text at the bottom. Default is `true`.
- `data-agent-id`: The Agent ID used for backend identification and API calls. Default is `xyz`. Ignored if `data-is-demo` is `true`.
- `data-context`: A string that provides additional context to the assistant. The value will be Base64 encoded and sent to the backend. Default is `null`.
- `data-cms`: The type of Content Management System the website uses (e.g., 'prestashop', 'woocommerce'). This can affect features like "Add to Cart" buttons in product carousels. Default is `''` (empty string).
- `data-start-open`: Set to `true` to make the chat widget open by default when the page loads. Default is `false`.
- `data-full-screen`: Set to `true` to make the chat widget open in fullscreen mode, covering the entire viewport. Default is `false`.
- `data-width`: The width of the chat widget container (e.g., '350px', '90%'). Default is `340px`.
- `data-height`: The height of the chat widget container (e.g., '500px', '80vh'). Default is `485px`.
- `data-z-index`: The z-index of the non-fullscreen chat widget, controlling its stacking order on the page. Default is `1000`.
- `data-is-demo`: Set to `true` to enable demo mode. This shows a predefined conversation including a product carousel and disables real chat functionality (API connection, message sending). Default is `false`.
- `data-closable`: Set to `false` to hide the close button (x) in the chat header, preventing users from closing the chat window once opened. Default is `true`.
- `data-custom-css`: A raw CSS string that is injected into the widget's Shadow DOM for advanced styling needs. Use with caution; see "Advanced Styling Escape Hatch".

### Supported Positions

The `data-position` attribute can be set to one of the following values:

- `top-left`: Positions the widget in the top-left corner of the page
- `top-right`: Positions the widget in the top-right corner of the page
- `bottom-left`: Positions the widget in the bottom-left corner of the page
- `bottom-right`: Positions the widget in the bottom-right corner of the page (default)

If no position is specified or an invalid value is provided, the widget will default to the `bottom-right` position. **Note:** This setting is ignored if `data-full-screen` is set to `true`.

## Programmatic control

Expose and control the widget from your page via the global `window.autocustChatWidget` API or a custom event:

- Open the widget: `window.autocustChatWidget.open()`
- Close the widget: `window.autocustChatWidget.close()` (no-op if `data-closable="false"`)
- Prefill a question (keeps it typed in): `window.autocustChatWidget.ask('Do you ship internationally?')`
- Prefill and send immediately: `window.autocustChatWidget.ask('Do you ship internationally?', { sendImmediately: true })`
- Listen for a custom event instead of calling the API directly:

```js
window.dispatchEvent(new CustomEvent('autocust:ask', {
  detail: { question: 'What is your return policy?', sendImmediately: true }
}));
```

Example link that opens the widget, injects a question, and sends it:

```html
<a href="#" onclick="window.autocustChatWidget.ask('Do you have student discounts?', { sendImmediately: true }); return false;">
  Ask about discounts
</a>
```

See `examples/landing.html` for a ready-to-run landing page demonstrating the widget plus programmatic triggers.

## Analytics & Attribution Events

### Purpose

The widget emits custom DOM events that can be captured by tag management systems (Google Tag Manager, Tealium, etc.) or custom analytics code. These events enable:

- **Conversion tracking**: Measure which interactions lead to sales
- **Attribution modeling**: Understand which touchpoints influence customer behavior
- **User behavior analysis**: Track how users engage with the chat widget
- **ROI measurement**: Correlate chat interactions with business outcomes

### Available Events

All events are dispatched on `window` with a `CustomEvent` containing relevant data in `event.detail`.

#### `autocust:chatOpened`

Emitted when the chat widget is opened by the user (via button click, programmatic API, or auto-open).

```javascript
window.addEventListener('autocust:chatOpened', (event) => {
  console.log('Chat widget was opened');
});
```

**Use cases:**
- Track chat engagement rate
- Measure effectiveness of chat triggers
- Correlate chat opens with page scrolls, time on page, or other user actions

---

#### `autocust:productClicked`

Emitted when a user interacts with a product in the product carousel (either viewing the product or adding to cart).

```javascript
window.addEventListener('autocust:productClicked', (event) => {
  const { product, action } = event.detail;
  console.log('Product interaction:', product.name, action);
  // product contains: id, name, price, url
  // action is either: 'view' or 'add_to_cart'
});
```

**Event detail:**
| Property | Type | Description |
|----------|------|-------------|
| `product.id` | string/number | Product identifier |
| `product.name` | string | Product name |
| `product.price` | number | Product price |
| `product.url` | string | Product URL |
| `action` | string | Either `'view'` (clicked product card) or `'add_to_cart'` (clicked add-to-cart button) |

**Use cases:**
- Track product interest generated by chat
- Attribute conversions to specific chat interactions
- Measure effectiveness of product recommendations in chat

---

#### `autocust:ctaClicked`

Emitted when a user clicks a Call-to-Action (CTA) button displayed below a message.

```javascript
window.addEventListener('autocust:ctaClicked', (event) => {
  const { url, ctaText } = event.detail;
  console.log('CTA clicked:', ctaText, '→', url);
});
```

**Event detail:**
| Property | Type | Description |
|----------|------|-------------|
| `url` | string | The target URL of the CTA |
| `ctaText` | string | The button text label |

**Use cases:**
- Track which CTAs drive the most engagement
- A/B test different CTA texts
- Attribute conversions to specific chat recommendations

---

### Google Tag Manager Integration

Example setup for GTM:

```javascript
// Add this to your page or via GTM custom HTML tag
window.addEventListener('autocust:chatOpened', () => {
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({ event: 'autocust_chat_opened' });
});

window.addEventListener('autocust:productClicked', (e) => {
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'autocust_product_clicked',
    ecommerce: {
      products: [{
        id: e.detail.product.id,
        name: e.detail.product.name,
        price: e.detail.product.price
      }]
    },
    interaction_type: e.detail.action
  });
});

window.addEventListener('autocust:ctaClicked', (e) => {
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'autocust_cta_clicked',
    cta_text: e.detail.ctaText,
    destination_url: e.detail.url
  });
});
```

Then configure GTM triggers based on these event names to fire your analytics tags (Google Analytics 4, Facebook Pixel, etc.).

### Combined Example

```javascript
// Comprehensive tracking setup
function setupChatWidgetAnalytics() {
  // Chat engagement
  window.addEventListener('autocust:chatOpened', () => {
    trackEvent('chat_opened');
  });

  // Product interactions
  window.addEventListener('autocust:productClicked', (e) => {
    trackEvent('product_clicked', {
      product_id: e.detail.product.id,
      product_name: e.detail.product.name,
      action: e.detail.action
    });
  });

  // CTA engagement
  window.addEventListener('autocust:ctaClicked', (e) => {
    trackEvent('cta_clicked', {
      cta_text: e.detail.ctaText,
      url: e.detail.url
    });
  });
}

// Initialize when widget loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChatWidgetAnalytics);
} else {
  setupChatWidgetAnalytics();
}
```

## Advanced Styling Escape Hatch

When the built-in CSS custom properties are not enough, you can supply a raw CSS string via the `data-custom-css` attribute. The provided CSS is injected into the widget's Shadow DOM and can target internal elements.

```html
<script
  src="https://cdn.jsdelivr.net/gh/Autocust/ai-chat-widget@latest/dist/chat-widget.min.js"
  data-api-url="https://your-api-endpoint.com"
  data-custom-css="
    #chat-header {
      min-height: 70px;
      font-family: 'Georgia', serif;
    }
    .assistant-message {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  "
></script>
```

**Important warnings:**

- **No stable DOM API:** Internal IDs, classes, and markup are private. They may change in any release without notice.
- **High risk of breakage:** You are responsible for maintaining and testing custom styles after each widget upgrade.
- **Selector discipline:** Keep selectors as specific as necessary while avoiding overly complex rules to reduce the chance of conflicts.

## Development

In case you want to contribute the widget codebase, you can install the dependencies and run the development server:

```bash
npm install
```

```bash
npm run dev
```

The widget preview will be available at `http://localhost:5173` and it will automatically live update if you modify the code. You can modify the props in `main.js` to test different configurations, including `isDemo: true`.

## Build

```bash
npm run build
```
