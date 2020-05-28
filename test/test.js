describe('details-menu element', function () {
  describe('element creation', function () {
    it('creates from document.createElement', function () {
      const el = document.createElement('details-menu')
      assert.equal('DETAILS-MENU', el.nodeName)
      assert(el instanceof window.DetailsMenuElement)
    })

    it('creates from constructor', function () {
      const el = new window.DetailsMenuElement()
      assert.equal('DETAILS-MENU', el.nodeName)
    })
  })

  describe('after tree insertion', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary data-menu-button><em>Click</em></summary>
          <details-menu>
            <button type="button" role="menuitem" data-menu-button-text>Hubot</button>
            <button type="button" role="menuitem" data-menu-button-contents><strong>Bender</strong></button>
            <button type="button" role="menuitem">BB-8</button>
            <button type="button" role="menuitem" data-menu-button-text aria-disabled="true">WALL-E</button>
            <button type="button" role="menuitem" disabled>R2-D2</button>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('has default attributes set', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const menu = details.querySelector('details-menu')
      assert.equal(summary.getAttribute('role'), 'button')
      assert.equal(menu.getAttribute('role'), 'menu')
    })

    it('opens and does not focus an item on mouse click', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      details.open = true
      summary.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      details.dispatchEvent(new CustomEvent('toggle'))
      assert.equal(summary, document.activeElement, 'mouse toggle open leaves summary focused')
    })

    it('opens and focuses first item on summary enter', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      details.open = true
      summary.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      details.dispatchEvent(new CustomEvent('toggle'))

      const first = details.querySelector('[role="menuitem"]')
      assert.equal(first, document.activeElement, 'toggle open focuses first item')
    })

    it('opens and focuses first item on arrow down', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      assert(!details.open, 'menu is not open')

      summary.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      assert(details.open, 'menu is open')

      const first = details.querySelector('[role="menuitem"]')
      assert.equal(first, document.activeElement, 'arrow focuses first item')
    })

    it('opens and focuses last item on arrow up', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      assert(!details.open, 'menu is not open')

      summary.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      assert(details.open, 'menu is open')

      const last = [...details.querySelectorAll('[role="menuitem"]:not([disabled]):not([aria-disabled])')].pop()
      assert.equal(last, document.activeElement, 'arrow focuses last item')
    })

    it('navigates items with arrow keys', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      details.open = true
      summary.focus()

      const [first, second, rest] = details.querySelectorAll('[role="menuitem"]')
      assert(rest)

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      assert.equal(first, document.activeElement, 'arrow down focuses first item')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      assert.equal(second, document.activeElement, 'arrow down focuses second item')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      assert.equal(first, document.activeElement, 'arrow up focuses first item')
    })

    it('closes and focuses summary on escape', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      details.open = true

      const first = details.querySelector('[role="menuitem"]')
      first.focus()
      assert.equal(first, document.activeElement)

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      assert.equal(summary, document.activeElement, 'escape focuses summary')
      assert(!details.open, 'details toggles closed')
    })

    it('allow propagation on escape if details is closed', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') summary.textContent = 'Propagated'
      })

      summary.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      assert.equal(summary.textContent, 'Propagated')
    })

    it('updates the button label with text', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('button')
      assert.equal(summary.textContent, 'Click')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary.textContent, 'Hubot')
    })

    it('updates the button label with HTML', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('[data-menu-button-contents]')
      assert.equal(summary.textContent, 'Click')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      // eslint-disable-next-line github/unescaped-html-literal
      assert.equal(summary.innerHTML, '<strong>Bender</strong>')
    })

    it('fires events in order', function (done) {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const menu = details.querySelector('details-menu')
      const item = details.querySelector('button')

      menu.addEventListener('details-menu-select', event => {
        assert(details.open, 'menu is still open')
        assert.equal(event.detail.relatedTarget, item)
        assert.equal(summary.textContent, 'Click')
      })

      menu.addEventListener('details-menu-selected', event => {
        assert(!details.open, 'menu is closed')
        assert.equal(event.detail.relatedTarget, item)
        assert.equal(summary.textContent, 'Hubot')
        done()
      })

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open)
    })

    it('fires cancellable select event', function (done) {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const menu = details.querySelector('details-menu')
      const item = details.querySelector('button')
      let selectedEventCounter = 0

      menu.addEventListener('details-menu-select', event => {
        event.preventDefault()
        assert(details.open, 'menu is still open')
        assert.equal(summary.textContent, 'Click')
        setTimeout(() => {
          assert.equal(selectedEventCounter, 0, 'selected event is not fired')
          done()
        }, 0)
      })

      menu.addEventListener('details-menu-selected', () => {
        selectedEventCounter++
      })

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open)
    })

    it('does not trigger aria-disabled item', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      let eventCounter = 0

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))

      const notDisabled = details.querySelectorAll('[role="menuitem"]')[2]
      assert.equal(notDisabled, document.activeElement, 'arrow focuses on the last non-disabled item')

      const disabled = details.querySelector('[aria-disabled="true"]')
      document.addEventListener('details-menu-selected', () => eventCounter++, true)
      disabled.dispatchEvent(new MouseEvent('click', {bubbles: true}))

      assert.equal(eventCounter, 0, 'selected event is not fired')
      assert(details.open, 'menu stays open')
    })

    it('does not trigger disabled item', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      let eventCounter = 0

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))

      const disabled = details.querySelector('[disabled]')
      document.addEventListener('details-menu-selected', () => eventCounter++, true)
      disabled.dispatchEvent(new MouseEvent('click', {bubbles: true}))

      assert.equal(eventCounter, 0, 'selected event is not fired')
      assert(details.open, 'menu stays open')
    })
  })

  describe('mutually exclusive menu items as buttons', function () {
    beforeEach(function () {
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

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('manages checked state and fires events', function () {
      const details = document.querySelector('details')
      const item = details.querySelector('button')
      let eventCounter = 0
      document.addEventListener('details-menu-selected', () => eventCounter++, true)

      assert.equal(item.getAttribute('aria-checked'), 'false')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)
      assert.equal(eventCounter, 1, 'selected event is fired once')
    })
  })

  describe('mutually exclusive menu items as labels', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Click</summary>
          <details-menu>
            <label tabindex="0" role="menuitemradio" aria-checked="false"><input value="Hubot" name="robot" type="radio"> Hubot</label>
            <label tabindex="0" role="menuitemradio" aria-checked="false"><input value="Bender" name="robot" type="radio"> Bender</label>
            <label tabindex="0" role="menuitemradio" aria-checked="false"><input value="BB-8" name="robot" type="radio"> BB-8</label>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('manages checked state and fires events', function () {
      const details = document.querySelector('details')
      const item = details.querySelector('label')
      let eventCounter = 0
      document.addEventListener('details-menu-selected', () => eventCounter++, true)

      assert.equal(item.getAttribute('aria-checked'), 'false')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)
      assert.equal(eventCounter, 1, 'selected event is fired once')
    })
  })

  describe('with labels as menu item checkboxes', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Click</summary>
          <details-menu>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="false"><input type="checkbox" name="robot"> Hubot</label>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="true"><input type="checkbox" name="robot" checked> Bender</label>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="false"><input type="checkbox" name="robot"> BB-8</label>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('manages checked state and fires events', function () {
      const details = document.querySelector('details')
      const summary = document.querySelector('summary')
      const item = details.querySelector('label')
      let eventCounter = 0
      document.addEventListener('details-menu-selected', () => eventCounter++, true)

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open, 'menu opens')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open, 'menu stays open')
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 2)

      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'false')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)

      assert.equal(eventCounter, 2, 'selected event is fired twice')
    })
  })

  describe('with labels as menu item with indeterminate checkboxes', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Click</summary>
          <details-menu>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="false"><input type="checkbox" name="robot"> Hubot</label>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="true"><input type="checkbox" name="robot" checked> Bender</label>
            <label tabindex="0" role="menuitemcheckbox" aria-checked="false"><input type="checkbox" name="robot"> BB-8</label>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('manages checked state and fires events', function () {
      const details = document.querySelector('details')
      const summary = document.querySelector('summary')
      const item = details.querySelector('label')
      const input = item.querySelector('input')
      let eventCounter = 0
      document.addEventListener('details-menu-selected', () => eventCounter++, true)

      input.indeterminate = true
      input.dispatchEvent(new Event('change', {bubbles: true}))

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open, 'menu opens')
      assert.equal(item.getAttribute('aria-checked'), 'mixed')

      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open, 'menu stays open')
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 2)

      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'false')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)

      assert.equal(eventCounter, 3, 'selected event is fired three times')
    })
  })

  describe('with no valid menu items', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Click</summary>
          <details-menu>
            <button type="button" role="menuitem" aria-disabled="true">Hubot</button>
            <button type="button" role="menuitem" disabled>Bender</button>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('focus stays on summary', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary, document.activeElement, 'summary remains focused on toggle')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      assert.equal(summary, document.activeElement, 'summary remains focused on navigation')
    })
  })

  describe('opening the menu', function () {
    beforeEach(function () {
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

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('closes other open menus', function () {
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

    it('does not close open parent menu', function () {
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

  describe('deferred loading menu content', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Menu 1</summary>
          <details-menu src="/test" preload>
            <include-fragment>
              Loading…
            </include-fragment>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('fetches content on toggle', function () {
      const details = document.querySelector('details')
      const loader = details.querySelector('include-fragment')

      assert(!loader.hasAttribute('src'))

      details.open = true
      details.dispatchEvent(new CustomEvent('toggle'))

      assert.equal('/test', loader.getAttribute('src'))
    })

    it('fetches content on hover', function () {
      const details = document.querySelector('details')
      const loader = details.querySelector('include-fragment')

      assert(!loader.hasAttribute('src'))

      details.dispatchEvent(new CustomEvent('mouseover'))

      assert.equal('/test', loader.getAttribute('src'))
    })

    it('does not fetch nested include-fragment', function () {
      const details = document.querySelector('details')
      const loader = details.querySelector('include-fragment')

      details.dispatchEvent(new CustomEvent('mouseover'))
      assert.equal('/test', loader.getAttribute('src'), 'mouse hover should trigger fetch')

      // Simulate include-fragment fetch.
      const response = document.createElement('include-fragment')
      loader.replaceWith(response)

      details.open = true
      details.dispatchEvent(new CustomEvent('toggle'))
      assert(!response.hasAttribute('src'), 'toggle should not trigger second fetch')
    })
  })

  describe('with input[autofocus]', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <details>
          <summary>Menu 1</summary>
          <details-menu role="none">
            <input autofocus>
            <div role="menu">
              <button role="menuitem">First item</button>
            </div>
          </details-menu>
        </details>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('autofocuses on input on mouse click', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const menu = details.querySelector('details-menu')
      const input = details.querySelector('input')

      summary.focus()
      details.open = true
      summary.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      details.dispatchEvent(new CustomEvent('toggle'))
      assert.equal(menu.getAttribute('role'), 'none')
      assert.equal(input, document.activeElement, 'mouse toggle open leaves summary focused')
    })

    it('autofocuses on input on keyboard activation', function () {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const input = details.querySelector('input')

      summary.focus()
      details.open = true
      summary.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      details.dispatchEvent(new CustomEvent('toggle'))

      assert.equal(input, document.activeElement, 'toggle open focuses on [autofocus]')
    })
  })

  describe('closing the menu', function () {
    beforeEach(function () {
      const container = document.createElement('div')
      container.innerHTML = `
        <div class="dialog">
          <details open>
            <summary data-menu-button><em>Click</em></summary>
            <details-menu>
              <button type="button" role="menuitem" data-menu-button-text>Hubot</button>
              <button type="button" role="menuitem" data-menu-button-contents><strong>Bender</strong></button>
              <button type="button" role="menuitem">BB-8</button>
              <button type="button" role="menuitem" data-menu-button-text aria-disabled="true">WALL-E</button>
              <button type="button" role="menuitem" disabled>R2-D2</button>
            </details-menu>
          </details>
        </div>
      `
      document.body.append(container)
    })

    afterEach(function () {
      document.body.innerHTML = ''
    })

    it('does not propagate the key event when a user closes the menu with esc', function () {
      const dialog = document.querySelector('.dialog')
      const details = dialog.querySelector('details')
      let dialogClosed = false
      let detailsClosed = false

      dialog.addEventListener('keydown', () => {
        dialogClosed = true
      })

      details.addEventListener('keydown', () => {
        detailsClosed = true
      })

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))

      // The details menu is closed
      assert.isTrue(detailsClosed)

      // The dialog is not closed
      assert.isFalse(dialogClosed)
    })
  })
})
