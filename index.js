/* @flow */

class DetailsMenuElement extends HTMLElement {
  constructor() {
    super()
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
    if (summary) summary.setAttribute('aria-haspopup', 'true')

    details.addEventListener('click', clicked)
    details.addEventListener('keydown', keydown)
    details.addEventListener(
      'toggle',
      () => {
        if (!this.src) return
        const loader: any = this.querySelector('include-fragment')
        if (loader) {
          loader.addEventListener('loadend', focusInput.bind(null, details))
          loader.src = this.src
        }
      },
      {once: true}
    )

    details.addEventListener('toggle', closeCurrentMenu)
    details.addEventListener('toggle', focusInput.bind(null, details))
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

function focusInput(details: Element) {
  if (!(details: any).open) return
  const input = details.querySelector('[autofocus]')
  if (input) {
    input.focus()
  }
}

function sibling(details: Element, next: boolean): HTMLElement {
  const options = Array.from(details.querySelectorAll('[role^="menuitem"]:not([hidden])'))
  const selected = document.activeElement
  const index = options.indexOf(selected)
  const sibling = next ? options[index + 1] : options[index - 1]
  const def = next ? options[0] : options[options.length - 1]
  return sibling || def
}

const ctrlBindings = navigator.userAgent.match(/Macintosh/)

function clicked(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return

  const details = event.currentTarget
  if (!(details instanceof Element)) return

  // Ignore clicks from nested details.
  if (target.closest('details') !== details) return

  const item = target.closest('[role^="menuitem"]')
  if (item) commit(item, details)
}

function isCheckable(el: Element): boolean {
  const role = el.getAttribute('role')
  return role === 'menuitemradio' || role === 'menuitemcheckbox'
}

function updateChecked(selected: Element, details: Element) {
  if (!isCheckable(selected)) return

  if (selected.getAttribute('role') === 'menuitemradio') {
    for (const el of details.querySelectorAll('[role="menuitemradio"]')) {
      el.setAttribute('aria-checked', 'false')
    }
  }
  selected.setAttribute('aria-checked', 'true')
}

function commit(selected: Element, details: Element) {
  updateLabel(selected, details)
  updateChecked(selected, details)
  close(details)
  selected.dispatchEvent(new CustomEvent('details-menu-selected', {bubbles: true}))
}

function keydown(event: KeyboardEvent) {
  const details: any = event.currentTarget

  // Ignore key presses from nested details.
  if (details.querySelector('details[open]')) return

  switch (event.key) {
    case 'Escape':
      close(details)
      event.preventDefault()
      break
    case 'ArrowDown':
      sibling(details, true).focus()
      event.preventDefault()
      break
    case 'ArrowUp':
      sibling(details, false).focus()
      event.preventDefault()
      break
    case 'n':
      if (ctrlBindings && event.ctrlKey) {
        sibling(details, true).focus()
        event.preventDefault()
      }
      break
    case 'p':
      if (ctrlBindings && event.ctrlKey) {
        sibling(details, false).focus()
        event.preventDefault()
      }
      break
    case ' ':
    case 'Enter':
      {
        const selected = document.activeElement
        if (selected && isMenuItem(selected) && selected.closest('details') === details) {
          event.preventDefault()
          event.stopPropagation()
          commit(selected, details)
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
  ;(details: any).open = false
  const summary = details.querySelector('summary')
  if (summary) summary.focus()
}

function updateLabel(item: Element, details: Element) {
  const button = details.querySelector('[data-menu-button]')
  if (!button) return

  const text = label(item) || label(item.querySelector('[data-menu-button-text]'))
  if (text) button.textContent = text
}

function label(el: ?Element): ?string {
  if (!el) return null
  const text = el.getAttribute('data-menu-button-text')
  if (text == null) return null
  return text === '' ? el.textContent : text
}

export default DetailsMenuElement

if (!window.customElements.get('details-menu')) {
  window.DetailsMenuElement = DetailsMenuElement
  window.customElements.define('details-menu', DetailsMenuElement)
}
