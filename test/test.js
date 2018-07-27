describe('details-menu element', function() {
  describe('element creation', function() {
    it('creates from document.createElement', function() {
      const el = document.createElement('details-menu')
      assert.equal('DETAILS-MENU', el.nodeName)
      assert(el instanceof window.DetailsMenuElement)
    })

    it('creates from constructor', function() {
      const el = new window.DetailsMenuElement()
      assert.equal('DETAILS-MENU', el.nodeName)
    })
  })

  describe('after tree insertion', function() {
    beforeEach(function() {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary data-menu-button><em>Click</em></summary>
          <details-menu>
            <button type="button" role="menuitem" data-menu-button-text>Hubot</button>
            <button type="button" role="menuitem" data-menu-button-contents><strong>Bender</strong></button>
            <button type="button" role="menuitem">BB-8</button>
            <button type="button" role="menuitem" data-menu-button-text aria-disabled="true">WALL-E</button>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('manages focus', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary, document.activeElement, 'summary remains focused on toggle')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}))
      const first = details.querySelector('[role="menuitem"]')
      assert.equal(first, document.activeElement, 'arrow focuses first item')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))
      assert.equal(summary, document.activeElement, 'escape focuses summary')
    })

    it('updates the button label with text', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('button')
      assert.equal(summary.textContent, 'Click')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary.textContent, 'Hubot')
    })

    it('updates the button label with HTML', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('[data-menu-button-contents]')
      assert.equal(summary.textContent, 'Click')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary.innerHTML, '<strong>Bender</strong>')
    })

    it('does not trigger disabled item', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      let eventCounter = 0

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}))

      const disabled = details.querySelector('[aria-disabled="true"]')
      assert.equal(disabled, document.activeElement, 'arrow focuses the disabled item')

      disabled.addEventListener('details-menu-selected', () => eventCounter++)
      disabled.dispatchEvent(new MouseEvent('click', {bubbles: true}))

      assert.equal(eventCounter, 0, 'selected event is not fired')
      assert(details.open, 'menu stays open')
    })
  })

  describe('mutually exclusive menu items', function() {
    beforeEach(function() {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Click</summary>
          <details-menu>
            <button type="button" role="menuitemradio" aria-checked="false">Hubot</button>
            <button type="button" role="menuitemradio" aria-checked="false">Bender</button>
            <button type="button" role="menuitemradio" aria-checked="false">BB-8</button>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('manages checked state', function() {
      const details = document.querySelector('details')
      const item = details.querySelector('button')
      assert.equal(item.getAttribute('aria-checked'), 'false')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)
    })
  })

  describe('opening the menu', function() {
    beforeEach(function() {
      const container = document.createElement('div')
      container.innerHTML = `
        <details class="parent">
          <summary>Menu 1</summary>
          <details-menu>
            <details class="nested">
              <summary>Menu 2</summary>
              <details-menu></details-menu>
            </details>
          </details-menu>
        </details>
        <details class="sibling">
          <summary>Menu 3</summary>
          <details-menu></details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('closes other open menus', function() {
      const parent = document.querySelector('.parent')
      const sibling = document.querySelector('.sibling')

      parent.open = true
      parent.dispatchEvent(new CustomEvent('toggle'))
      assert(parent.open)

      sibling.open = true
      sibling.dispatchEvent(new CustomEvent('toggle'))

      assert(sibling.open)
      assert(!parent.open)
    })

    it('does not close open parent menu', function() {
      const parent = document.querySelector('.parent')
      const nested = document.querySelector('.nested')

      parent.open = true
      parent.dispatchEvent(new CustomEvent('toggle'))
      assert(parent.open)

      nested.open = true
      nested.dispatchEvent(new CustomEvent('toggle'))

      assert(nested.open)
      assert(parent.open)
    })
  })
})
