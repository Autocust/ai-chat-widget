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
<script src="https://unpkg.com/@autocust/ai-chat-widget@latest/embed.js"></script>
```

## Example

```html
<script
    src="https://cdn.jsdelivr.net/gh/Autocust/ai-chat-widget@latest/dist/chat-widget.min.js"
    data-title="My Custom Assistant"
    data-api-url="https://your-api-endpoint.com"
    data-brand-color="#ff0000"
    data-initial-message="How can I help you today?"
    data-button-icon="🤖"
    data-position="bottom-right"
></script>
```

## Available options:

- `data-title`: The title of the chat widget.
- `data-api-url`: The URL of the API that will power the chat widget.
- `data-brand-color`: The brand color of the chat widget.
- `data-initial-message`: The initial message of the chat widget.
- `data-button-icon`: The icon of the chat widget.
- `data-position`: The position of the chat widget.

### Supported Positions

The `data-position` attribute can be set to one of the following values:

- `top-left`: Positions the widget in the top-left corner of the page
- `top-right`: Positions the widget in the top-right corner of the page
- `bottom-left`: Positions the widget in the bottom-left corner of the page
- `bottom-right`: Positions the widget in the bottom-right corner of the page (default)

If no position is specified or an invalid value is provided, the widget will default to the `bottom-right` position.

## Development

```bash
npm install
```

Make your changes in the AIChatWidget.svelte and embed.js files.

## Build

```bash
npm run build
```
