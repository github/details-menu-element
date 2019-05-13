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

  connectedCallback() {
    this.setAttribute('role', 'menu')

    const details = this.parentElement
    if (!details) return

    const summary = details.querySelector('summary')
    if (summary) summary.setAttribute('aria-haspopup', 'menu')

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
  const mousedown = () => (isMouse = true)
  const keydown = () => (isMouse = false)
  const toggle = () => {
    autofocus(details)
    if (details.hasAttribute('open') && !isMouse) {
      focusFirstItem(details)
    }
  }

  details.addEventListener('mousedown', mousedown)
  details.addEventListener('keydown', keydown)
  details.addEventListener('toggle', toggle)

  return {
    unsubscribe: () => {
      details.removeEventListener('mousedown', mousedown)
      details.removeEventListener('keydown', keydown)
      details.removeEventListener('toggle', toggle)
    }
  }
}

function closeCurrentMenu(event) {
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

function autofocus(details: Element) {
  if (!details.hasAttribute('open')) return

  const input = details.querySelector('[autofocus]')
  if (input) {
    input.focus()
  }
}

// Focus first item unless an item is already focused.
function focusFirstItem(details: Element) {
  const selected = document.activeElement
  if (selected && isMenuItem(selected) && details.contains(selected)) return

  const target = sibling(details, true)
  if (target) target.focus()
}

function sibling(details: Element, next: boolean): ?HTMLElement {
  const options = Array.from(
    details.querySelectorAll('[role^="menuitem"]:not([hidden]):not([disabled]):not([aria-disabled="true"])')
  )
  const selected = document.activeElement
  const index = options.indexOf(selected)
  const sibling = next ? options[index + 1] : options[index - 1]
  const def = next ? options[0] : options[options.length - 1]
  return sibling || def
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
    el.setAttribute('aria-checked', (input instanceof HTMLInputElement ? input.checked : el === selected).toString())
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
      close(details)
      event.preventDefault()
      event.stopPropagation()
      break
    case 'ArrowDown':
      {
        if (isSummaryFocused && !details.hasAttribute('open')) {
          details.setAttribute('open', '')
        }
        const target = sibling(details, true)
        if (target) target.focus()
        event.preventDefault()
      }
      break
    case 'ArrowUp':
      {
        if (isSummaryFocused && !details.hasAttribute('open')) {
          details.setAttribute('open', '')
        }
        const target = sibling(details, false)
        if (target) target.focus()
        event.preventDefault()
      }
      break
    case 'n':
      {
        if (ctrlBindings && event.ctrlKey) {
          const target = sibling(details, true)
          if (target) target.focus()
          event.preventDefault()
        }
      }
      break
    case 'p':
      {
        if (ctrlBindings && event.ctrlKey) {
          const target = sibling(details, false)
          if (target) target.focus()
          event.preventDefault()
        }
      }
      break
    case ' ':
    case 'Enter':
      {
        const selected = document.activeElement
        if (selected && isMenuItem(selected) && selected.closest('details') === details) {
          event.preventDefault()
          event.stopPropagation()
          selected.click()
        }
      }
      break
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
