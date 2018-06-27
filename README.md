# &lt;details-menu&gt; element

A menu that's opened with a &lt;details> button.

## Installation

```
$ npm install @github/details-menu-element
```

## Usage

```js
import '@github/details-menu-element'
```

```html
<details>
  <summary>Robots</summary>
  <details-menu>
    <ul>
      <li><button type="button" role="menuitem">Hubot</button></li>
      <li><button type="button" role="menuitem">Bender</button></li>
      <li><button type="button" role="menuitem">BB-8</button></li>
    </ul>
  </details-menu>
</details>
```

## Browser support

Browsers without native [custom element support][support] require a [polyfill][].

- Chrome
- Firefox
- Safari
- Internet Explorer 11
- Microsoft Edge

[support]: https://caniuse.com/#feat=custom-elementsv1
[polyfill]: https://github.com/webcomponents/custom-elements

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
