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
            <button type="button" role="menuitem" disabled>R2-D2</button>
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
      // eslint-disable-next-line github/unescaped-html-literal
      assert.equal(summary.innerHTML, '<strong>Bender</strong>')
    })

    it('fires events in order', function(done) {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('button')

      item.addEventListener('details-menu-select', () => {
        assert(details.open, 'menu is still open')
        assert.equal(summary.textContent, 'Click')
      })

      item.addEventListener('details-menu-selected', () => {
        assert(!details.open, 'menu is closed')
        assert.equal(summary.textContent, 'Hubot')
        done()
      })

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open)
    })

    it('fires cancellable select event', function(done) {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('button')
      let selectedEventCounter = 0

      item.addEventListener('details-menu-select', event => {
        event.preventDefault()
        assert(details.open, 'menu is still open')
        assert.equal(summary.textContent, 'Click')
        setTimeout(() => {
          assert.equal(selectedEventCounter, 0, 'selected event is not fired')
          done()
        }, 0)
      })

      item.addEventListener('details-menu-selected', () => {
        selectedEventCounter++
      })

      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert(details.open)
    })

    it('does not trigger aria-disabled item', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      let eventCounter = 0

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}))

      const notDisabled = details.querySelectorAll('[role="menuitem"]')[2]
      assert.equal(notDisabled, document.activeElement, 'arrow focuses on the last non-disabled item')

      const disabled = details.querySelector('[aria-disabled="true"]')
      disabled.addEventListener('details-menu-selected', () => eventCounter++)
      disabled.dispatchEvent(new MouseEvent('click', {bubbles: true}))

      assert.equal(eventCounter, 0, 'selected event is not fired')
      assert(details.open, 'menu stays open')
    })

    it('does not trigger disabled item', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      let eventCounter = 0

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}))

      const disabled = details.querySelector('[disabled]')
      disabled.addEventListener('details-menu-selected', () => eventCounter++)
      disabled.dispatchEvent(new MouseEvent('click', {bubbles: true}))

      assert.equal(eventCounter, 0, 'selected event is not fired')
      assert(details.open, 'menu stays open')
    })
  })

  describe('mutually exclusive menu items as buttons', function() {
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

  describe('mutually exclusive menu items as labels', function() {
    beforeEach(function() {
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

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('manages checked state', function() {
      const details = document.querySelector('details')
      const item = details.querySelector('label')
      assert.equal(item.getAttribute('aria-checked'), 'false')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)
    })
  })

  describe('with labels as menu item checkboxes', function() {
    beforeEach(function() {
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

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('manages checked state and fires events', function() {
      const details = document.querySelector('details')
      const summary = document.querySelector('summary')
      const item = details.querySelector('label')
      let eventCounter = 0
      details.addEventListener('details-menu-selected', () => eventCounter++)

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

  describe('with no valid menu items', function() {
    beforeEach(function() {
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

    afterEach(function() {
      document.body.innerHTML = ''
    })

    it('focus stays on summary', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')

      summary.focus()
      summary.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary, document.activeElement, 'summary remains focused on toggle')

      details.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}))
      assert.equal(summary, document.activeElement, 'summary remains focused on navigation')
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
