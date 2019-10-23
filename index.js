/* @flow strict */

class DetailsMenuElement extends HTMLElement {
  constructor() {
    super()
  }

  get preload(): boolean {
    return this.hasAttribute('preload')
  }

  set preload(value: boolean) {
    if (value) {
      this.setAttribute('preload', '')
    } else {
      this.removeAttribute('preload')
    }
  }

  get src(): string {
    return this.getAttribute('src') || ''
  }

  set src(value: string) {
    this.setAttribute('src', value)
  }

  get input(): ?HTMLInputElement {
    const inputId = this.getAttribute('input')
    const input = inputId && document.getElementById(inputId)
    return input instanceof HTMLInputElement ? input : null
  }

  clearFocus() {
    clearFocus(this)
  }

  selectFocusOrFirst() {
    const details = this.parentElement
    if (!details) return
    const element = getFocusedMenuItem(details) || sibling(details, true)
    if (element) element.click()
  }

  connectedCallback() {
    if (!this.hasAttribute('role') && !this.hasAttribute('input')) this.setAttribute('role', 'menu')

    const details = this.parentElement
    if (!details) return

    const summary = details.querySelector('summary')
    if (summary) {
      summary.setAttribute('aria-haspopup', 'menu')
      if (!summary.hasAttribute('role')) summary.setAttribute('role', 'button')
    }

    if (this.input) {
      this.input.addEventListener('blur', () => {
        clearFocus(this)
      })
    }

    details.addEventListener('click', shouldCommit)
    details.addEventListener('change', shouldCommit)
    details.addEventListener('keydown', keydown)
    details.addEventListener('toggle', loadFragment, {once: true})
    details.addEventListener('toggle', closeCurrentMenu)
    if (this.preload) {
      details.addEventListener('mouseover', loadFragment, {once: true})
    }

    const subscriptions = [focusOnOpen(details)]
    states.set(this, {details, subscriptions, loaded: false})
  }

  disconnectedCallback() {
    const state = states.get(this)
    if (!state) return

    states.delete(this)

    const {details, subscriptions} = state
    for (const sub of subscriptions) {
      sub.unsubscribe()
    }
    details.removeEventListener('click', shouldCommit)
    details.removeEventListener('change', shouldCommit)
    details.removeEventListener('keydown', keydown)
    details.removeEventListener('toggle', loadFragment, {once: true})
    details.removeEventListener('toggle', closeCurrentMenu)
    details.removeEventListener('mouseover', loadFragment, {once: true})
  }
}

const states = new WeakMap()

function loadFragment(event: Event) {
  const details = event.currentTarget
  if (!(details instanceof Element)) return

  const menu = details.querySelector('details-menu')
  if (!menu) return

  const src = menu.getAttribute('src')
  if (!src) return

  const state = states.get(menu)
  if (!state) return

  if (state.loaded) return
  state.loaded = true

  const loader = menu.querySelector('include-fragment')
  if (loader && !loader.hasAttribute('src')) {
    loader.addEventListener('loadend', () => autofocus(details))
    loader.setAttribute('src', src)
  }
}

function focusOnOpen(details: Element) {
  let isMouse = false
  const onmousedown = () => (isMouse = true)
  const onkeydown = () => (isMouse = false)
  const ontoggle = () => {
    if (!details.hasAttribute('open')) return
    if (autofocus(details)) return
    if (!isMouse) focusFirstItem(details)
  }

  details.addEventListener('mousedown', onmousedown)
  details.addEventListener('keydown', onkeydown)
  details.addEventListener('toggle', ontoggle)

  return {
    unsubscribe: () => {
      details.removeEventListener('mousedown', onmousedown)
      details.removeEventListener('keydown', onkeydown)
      details.removeEventListener('toggle', ontoggle)
    }
  }
}

function closeCurrentMenu(event: Event) {
  const el = event.currentTarget
  if (!(el instanceof Element)) return
  if (!el.hasAttribute('open')) return

  for (const menu of document.querySelectorAll('details[open] > details-menu')) {
    const opened = menu.closest('details')
    if (opened && opened !== el && !opened.contains(el)) {
      opened.removeAttribute('open')
    }
  }
}

function autofocus(details: Element): boolean {
  if (!details.hasAttribute('open')) return false
  const input = details.querySelector('[autofocus]')
  if (input) {
    input.focus()
    return true
  } else {
    return false
  }
}

// Focus first item unless an item is already focused.
function focusFirstItem(details: Element) {
  const selected = getFocusedMenuItem(details)
  if (selected) return

  const target = sibling(details, true)
  if (target) focus(target)
}

function getFocusedMenuItem(details: Element): ?HTMLElement {
  const menu = details.querySelector('details-menu')
  if (!(menu instanceof DetailsMenuElement)) return
  let selected = document.activeElement
  if (selected && menu.input && selected === menu.input) {
    const id = menu.input.getAttribute('aria-activedescendant')
    selected = id ? document.getElementById(id) : selected
  }
  return selected && details.contains(selected) && isMenuItem(selected) ? selected : null
}

function sibling(details: Element, next: boolean): ?HTMLElement {
  const options = Array.from(
    details.querySelectorAll('[role^="menuitem"]:not([hidden]):not([disabled]):not([aria-disabled="true"])')
  )
  const selected = getFocusedMenuItem(details)
  const index = options.indexOf(selected)
  const found = next ? options[index + 1] : options[index - 1]
  const def = next ? options[0] : options[options.length - 1]
  return found || def
}

const ctrlBindings = navigator.userAgent.match(/Macintosh/)

function shouldCommit(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return

  const details = event.currentTarget
  if (!(details instanceof Element)) return

  // Ignore clicks from nested details.
  if (target.closest('details') !== details) return

  if (event.type === 'click') {
    const menuitem = target.closest('[role="menuitem"], [role="menuitemradio"]')
    const onlyCommitOnChangeEvent = menuitem && menuitem.tagName === 'LABEL' && menuitem.querySelector('input')
    if (menuitem && !onlyCommitOnChangeEvent) {
      commit(menuitem, details)
    }
  } else if (event.type === 'change') {
    const menuitem = target.closest('[role="menuitemradio"], [role="menuitemcheckbox"]')
    if (menuitem) commit(menuitem, details)
  }
}

function updateChecked(selected: Element, details: Element) {
  for (const el of details.querySelectorAll('[role="menuitemradio"], [role="menuitemcheckbox"]')) {
    const input = el.querySelector('input[type="radio"], input[type="checkbox"]')
    let checkState = el === selected
    if (input instanceof HTMLInputElement) {
      checkState = input.indeterminate ? 'mixed' : input.checked
    }
    el.setAttribute('aria-checked', checkState.toString())
  }
}

function commit(selected: Element, details: Element) {
  if (selected.hasAttribute('disabled') || selected.getAttribute('aria-disabled') === 'true') return
  const menu = selected.closest('details-menu')
  if (!menu) return

  const dispatched = menu.dispatchEvent(
    new CustomEvent('details-menu-select', {
      cancelable: true,
      detail: {relatedTarget: selected}
    })
  )
  if (!dispatched) return

  updateLabel(selected, details)
  updateChecked(selected, details)
  if (selected.getAttribute('role') !== 'menuitemcheckbox') close(details)
  menu.dispatchEvent(
    new CustomEvent('details-menu-selected', {
      detail: {relatedTarget: selected}
    })
  )
}

function keydown(event: KeyboardEvent) {
  const details = event.currentTarget
  if (!(details instanceof Element)) return
  const isSummaryFocused = event.target instanceof Element && event.target.tagName === 'SUMMARY'

  // Ignore key presses from nested details.
  if (details.querySelector('details[open]')) return

  switch (event.key) {
    case 'Escape':
      if (details.hasAttribute('open')) {
        close(details)
        event.preventDefault()
        event.stopPropagation()
      }
      break
    case 'ArrowDown':
      {
        if (isSummaryFocused && !details.hasAttribute('open')) {
          details.setAttribute('open', '')
        }
        const target = sibling(details, true)
        if (target) focus(target)
        event.preventDefault()
      }
      break
    case 'ArrowUp':
      {
        if (isSummaryFocused && !details.hasAttribute('open')) {
          details.setAttribute('open', '')
        }
        const target = sibling(details, false)
        if (target) focus(target)
        event.preventDefault()
      }
      break
    case 'n':
      {
        if (ctrlBindings && event.ctrlKey) {
          const target = sibling(details, true)
          if (target) focus(target)
          event.preventDefault()
        }
      }
      break
    case 'p':
      {
        if (ctrlBindings && event.ctrlKey) {
          const target = sibling(details, false)
          if (target) focus(target)
          event.preventDefault()
        }
      }
      break
    case ' ':
    case 'Enter':
      {
        const selected = getFocusedMenuItem(details)
        if (selected) {
          event.preventDefault()
          event.stopPropagation()
          selected.click()
        }
      }
      break
  }
}

function focus(target) {
  const menu = target.closest('details-menu')
  if (!(menu instanceof DetailsMenuElement)) return
  clearFocus(menu)
  const input = menu.input

  if (input && document.activeElement === input) {
    if (!target.id) target.id = `rand-${(Math.random() * 1000).toFixed(0)}`
    target.setAttribute('aria-selected', 'true')
    input.setAttribute('aria-activedescendant', target.id)
  } else {
    target.focus()
  }
}

function clearFocus(menu) {
  if (menu.input) menu.input.removeAttribute('aria-activedescendant')
  for (const el of menu.querySelectorAll('[role^="menuitem"][aria-selected="true"]')) {
    el.removeAttribute('aria-selected')
  }
}

function isMenuItem(el: Element): boolean {
  const role = el.getAttribute('role')
  return role === 'menuitem' || role === 'menuitemcheckbox' || role === 'menuitemradio'
}

function close(details: Element) {
  details.removeAttribute('open')
  const summary = details.querySelector('summary')
  if (summary) summary.focus()
}

function updateLabel(item: Element, details: Element) {
  const button = details.querySelector('[data-menu-button]')
  if (!button) return

  const text = labelText(item)
  if (text) {
    button.textContent = text
  } else {
    const html = labelHTML(item)
    if (html) button.innerHTML = html
  }
}

function labelText(el: ?Element): ?string {
  if (!el) return null
  const textEl = el.hasAttribute('data-menu-button-text') ? el : el.querySelector('[data-menu-button-text]')

  if (!textEl) return null
  return textEl.getAttribute('data-menu-button-text') || textEl.textContent
}

function labelHTML(el: ?Element): ?string {
  if (!el) return null
  const contentsEl = el.hasAttribute('data-menu-button-contents') ? el : el.querySelector('[data-menu-button-contents]')

  return contentsEl ? contentsEl.innerHTML : null
}

export default DetailsMenuElement

if (!window.customElements.get('details-menu')) {
  window.DetailsMenuElement = DetailsMenuElement
  window.customElements.define('details-menu', DetailsMenuElement)
}
