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
          <summary data-menu-button>Click</summary>
          <details-menu>
            <button type="button" role="menuitem" aria-checked="false" data-menu-button-text>Hubot</button>
            <button type="button" role="menuitem" aria-checked="false">Bender</button>
            <button type="button" role="menuitem" aria-checked="false">BB-8</button>
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

    it('manages checked state', function() {
      const details = document.querySelector('details')
      const item = details.querySelector('button')
      assert.equal(item.getAttribute('aria-checked'), 'false')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(item.getAttribute('aria-checked'), 'true')
      assert.equal(details.querySelectorAll('[aria-checked="true"]').length, 1)
    })

    it('updates the button label', function() {
      const details = document.querySelector('details')
      const summary = details.querySelector('summary')
      const item = details.querySelector('button')
      assert.equal(summary.textContent, 'Click')
      item.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      assert.equal(summary.textContent, 'Hubot')
    })
  })
})
