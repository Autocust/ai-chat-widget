# AI Chat Widget

This project provides a versatile, embeddable chat widget for the [Autocust](https://www.autocust.it) AI sales assistant.

## Features

- **Customizable**: Easily customize the chat widget's appearance and behavior to match your brand's style.
- **Embeddable**: Simple to embed and integrate into your website.
- **Responsive**: Works seamlessly on all devices.
- **Intelligent**: Utilizes advanced AI models to provide intelligent responses.

## Quick Start

To use the AI Chat Widget on your website, add the following script tag anywhere within the `<body>` of your HTML page:

```html
<script
    src="https://cdn.jsdelivr.net/gh/Autocust/ai-chat-widget@latest/dist/chat-widget.min.js"
    data-title="My Custom Assistant"
    data-api-url="https://your-api-endpoint.com"
    data-brand-color="#ff0000"
    data-initial-message="How can I help you today?"
    data-button-icon="🤖"
    data-position="bottom-right"
    data-cta-text="Chiedi informazioni"
    data-open-in-new-tab="true"
></script>
```

## Available options:

- `data-title`: The title of the chat widget.
- `data-api-url`: The URL of the API that will power the chat widget.
- `data-brand-color`: The brand color of the chat widget.
- `data-initial-message`: The initial message of the chat widget.
- `data-button-icon`: The icon of the chat widget.
- `data-position`: The position of the chat widget.
- `data-cta-text`: The text for the call-to-action button in the chat widget.
- `data-open-in-new-tab`: A boolean value to determine if URLs should open in a new tab (default is `true`).
- `data-enable-utm`: Set to `true` to include UTM parameters in product URLs. Set to `false` to disable UTM parameters. Default is `true`.
- `data-persistent-session`: Set to `true` to enable persistent sessions, allowing users to retain their chat history across sessions. Default is `false`.
- `data-session-expiration`: The duration (in hours) for which the session is valid. After this period, the chat history will be wiped. Default is `24`.

### Supported Positions

The `data-position` attribute can be set to one of the following values:

- `top-left`: Positions the widget in the top-left corner of the page
- `top-right`: Positions the widget in the top-right corner of the page
- `bottom-left`: Positions the widget in the bottom-left corner of the page
- `bottom-right`: Positions the widget in the bottom-right corner of the page (default)

If no position is specified or an invalid value is provided, the widget will default to the `bottom-right` position.

## Development

In case you want to contribute the widget codebase, you can install the dependencies and run the development server:

```bash
npm install
```

```bash
npm run dev
```

The widget preview will be available at `http://localhost:5173` and it will automatically live update if you modify the code.

## Build

```bash
npm run build
```
