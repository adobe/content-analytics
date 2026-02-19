# @adobe/content-analytics

Tracks content interactions (page views, asset views, clicks, scroll depth) and sends them to Adobe Experience Platform via Alloy SDK.

## Installation

```bash
npm install @adobe/content-analytics
```

## Usage

```javascript
import initializeContentLibrary from "@adobe/content-analytics";

initializeContentLibrary({
  datastreamId: "your-datastream-id",
  includeExperiences: true,
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `datastreamId` | string | **required** | AEP datastream ID |
| `includeExperiences` | boolean | `false` | Enable page/experience tracking |
| `assetUrlQualifier` | string | - | RegEx pattern to filter assets by URL |
| `pageUrlQualifier` | string | - | RegEx pattern to filter pages by URL |
| `scrollDepthCollectionEnabled` | boolean | `true` | Track scroll depth |
| `assetsMaxBatchLength` | number | `32` | Max assets before auto-send |
| `imagesSelector` | string | `"img"` | CSS selector for images |
| `debounceNodeRegister` | number | `500` | Debounce for DOM observation (ms) |
| `throttleSendContentEvent` | number | `500` | Throttle for event sending (ms) |

## Requirements

- Adobe Experience Platform Web SDK (Alloy) must be initialized
- Modern browser with IntersectionObserver and MutationObserver support

## Development

```bash
npm install
npm test
npm run build
npm run lint
```

## Contributing

Contributions are welcome! See [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

Apache-2.0. See [LICENSE](LICENSE) for details.
