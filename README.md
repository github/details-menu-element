# &lt;details-menu&gt; element

A menu that's opened with a &lt;details> button.

## Installation

```
$ npm install @github/details-menu-element
```

## Usage

### Script

Import as a module:

```js
import '@github/details-menu-element'
```

With a script tag:

```html
<script type="module" src="./node_modules/@github/details-menu-element/dist/index.js">
```

### Markup


```html
<details>
  <summary>Robots</summary>
  <details-menu role="menu">
    <button type="button" role="menuitem">Hubot</button>
    <button type="button" role="menuitem">Bender</button>
    <button type="button" role="menuitem">BB-8</button>
  </details-menu>
</details>
```

Use `data-menu-button` and `data-menu-button-text` to update the button's text on menu item activation.

```html
<details>
  <summary>Preferred robot: <span data-menu-button>None</span></summary>
  <details-menu role="menu">
    <button type="button" role="menuitem" data-menu-button-text>Hubot</button>
    <button type="button" role="menuitem" data-menu-button-text>Bender</button>
    <button type="button" role="menuitem" data-menu-button-text>BB-8</button>
  </details-menu>
</details>
```

Use `data-menu-button` and `data-menu-button-contents` to update the button's HTML content on menu item activation.

```html
<details>
  <summary>Preferred robot: <span data-menu-button>None</span></summary>
  <details-menu role="menu">
    <button type="button" role="menuitem" data-menu-button-contents><img src="hubot.png"> Hubot</button>
    <button type="button" role="menuitem" data-menu-button-contents><img src="bender.png"> Bender</button>
    <button type="button" role="menuitem" data-menu-button-contents><img src="bb8.png"> BB-8</button>
  </details-menu>
</details>
```

Use `label[tabindex="0"][role=menuitemradio/menuitemcheckbox]` when dealing with radio and checkbox inputs menu items. Check states of the input element and the label will be synchronized.

```html
<details>
  <summary>Preferred robot</summary>
  <details-menu role="menu">
    <label tabindex="0" role="menuitemradio">
      <input type="radio" name="robot" value="Hubot"> Hubot
    </label>
    <label tabindex="0" role="menuitemradio">
      <input type="radio" name="robot" value="Bender"> Bender
    </label>
    <label tabindex="0" role="menuitemradio">
      <input type="radio" name="robot" value="BB-8"> BB-8
    </label>
  </details-menu>
</details>
```

### Events

- `details-menu-select` (cancelable) - fired on `<details-menu>` with `event.detail.relatedTarget` being the item to be selected.
- `details-menu-selected` - fired on `<details-menu>` with `event.detail.relatedTarget` being the item selected, after label is updated and menu is closed.

### Deferred loading

Menu content can be loaded from a server by embedding an
[`<include-fragment>`][fragment] element.

[fragment]: https://github.com/github/include-fragment-element/

```html
<details>
  <summary>Robots</summary>
  <details-menu src="/robots" preload>
    <include-fragment>Loading…</include-fragment>
  </details-menu>
</details>
```

The `src` attribute value is copied to the `<include-fragment>` the first
time the `<details>` button is toggled open, which starts the server fetch.

If the `preload` attribute is present, the server fetch will begin on mouse
hover over the `<details>` button, so the content may be loaded by the time
the menu is opened.

## Browser support

Browsers without native [custom element support][support] require a [polyfill][].

- Chrome
- Firefox
- Safari
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
