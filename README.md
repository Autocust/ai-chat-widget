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
    data-position="bottom-right"
    data-cta-text="Chiedi informazioni"
    data-open-in-new-tab="true"
    data-start-open="false"
    data-full-screen="false"
    data-is-demo="false"
></script>
```

## Available options:

- `data-title`: The title of the chat widget.
- `data-api-url`: The URL of the API that will power the chat widget. Ignored if `data-is-demo` is `true`.
- `data-chatbot-id`: The ID identifying the specific chatbot configuration to use (Header: `X-Chatbot-ID` for HTTP, Query Param: `chatbotId` for WebSocket). Default is `xyz`. Ignored if `data-is-demo` is `true`.
- `data-agent-id`: The Agent ID used for backend identification and API calls. Default is `xyz`. Ignored if `data-is-demo` is `true`.
- `data-cms`: The type of Content Management System the website uses (e.g., 'prestashop', 'woocommerce'). This can affect features like "Add to Cart" buttons in product carousels. Default is `''` (empty string).
- `data-theme`: The overall theme ('light' or 'dark'). Default is 'light'.
- `data-user-message-bg-color`: Background color for user messages (e.g., '#e0e0e0').
- `data-user-message-text-color`: Text color for user messages (e.g., '#000000').
- `data-assistant-message-bg-color`: Background color for assistant messages (e.g., '#f8f8f8').
- `data-assistant-message-text-color`: Text color for assistant messages (e.g., '#000000').
- `data-chat-button-bg-color`: Background color for the chat toggle button (e.g., '#000000').
- `data-chat-button-text-color`: Text/icon color for the chat toggle button (e.g., '#ffffff').
- `data-cta-button-bg-color`: Background color for Call-To-Action buttons below messages (e.g., '#f8f8f8').
- `data-cta-button-text-color`: Text color for Call-To-Action buttons below messages (e.g., '#000000').
- `data-initial-message`: The initial message displayed by the chat widget. Used in normal mode and as the first message in demo mode.
- `data-button-icon`: The icon for the chat toggle button (can be text, emoji, URL to image, or SVG markup).
- `data-position`: The position of the chat widget. Ignored if `data-full-screen` is `true`.
- `data-cta-text`: The default text for the call-to-action button in the chat widget (can be overridden by bot messages or demo content).
- `data-open-in-new-tab`: A boolean value to determine if URLs should open in a new tab (default is `true`).
- `data-enable-utm`: Set to `true` to include UTM parameters in product URLs. Set to `false` to disable UTM parameters. Default is `true`.
- `data-persistent-session`: Set to `true` to enable persistent sessions, allowing users to retain their chat history across sessions. Default is `false`. Ignored if `data-is-demo` is `true`.
- `data-session-expiration`: The duration (in hours) for which the session is valid. After this period, the chat history will be wiped. Default is `24`. Ignored if `data-is-demo` is `true`.
- `data-footer-text`: Custom text displayed in the footer area below the input field. Default is "Generato dall'IA. Verifica le informazioni importanti.".
- `data-show-powered-by`: Set to `false` to hide the "Powered by Autocust" text at the bottom. Default is `true`.
- `data-start-open`: Set to `true` to make the chat widget open by default when the page loads. Default is `false`.
- `data-full-screen`: Set to `true` to make the chat widget open in fullscreen mode, covering the entire viewport. Default is `false`.
- `data-is-demo`: Set to `true` to enable demo mode. This shows a predefined conversation including a product carousel and disables real chat functionality (API connection, message sending). Default is `false`.

### Supported Positions

The `data-position` attribute can be set to one of the following values:

- `top-left`: Positions the widget in the top-left corner of the page
- `top-right`: Positions the widget in the top-right corner of the page
- `bottom-left`: Positions the widget in the bottom-left corner of the page
- `bottom-right`: Positions the widget in the bottom-right corner of the page (default)

If no position is specified or an invalid value is provided, the widget will default to the `bottom-right` position. **Note:** This setting is ignored if `data-full-screen` is set to `true`.

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
