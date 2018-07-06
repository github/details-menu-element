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

Use `data-menu-button` and `data-menu-button-text` to have button text replaced on menu item activiation.

```html
<details>
  <summary>Preferred robot: <span data-menu-button>None</span></summary>
  <details-menu>
    <ul>
      <li><button type="button" role="menuitem" data-menu-button-text>Hubot</button></li>
      <li><button type="button" role="menuitem" data-menu-button-text>Bender</button></li>
      <li><button type="button" role="menuitem" data-menu-button-text>BB-8</button></li>
    </ul>
  </details-menu>
</details>
```

### Deferred loading

Menu content can be loaded from a server by embedding an
[`<include-fragment>`][fragment] element.

[fragment]: https://github.com/github/include-fragment-element/

```html
<details>
  <summary>Robots</summary>
  <details-menu src="/robots">
    <include-fragment>Loading…</include-fragment>
  </details-menu>
</details>
```

The `src` attribute value is copied to the `<include-fragment>` the first
time the `<details>` button is toggled open, which starts the server fetch.

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
