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
    if (summary) summary.setAttribute('aria-haspopup', 'menu')

    details.addEventListener('click', shouldCommit)
    details.addEventListener('change', shouldCommit)
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

  const menuitem =
    event.type === 'click'
      ? target.closest('[role="menuitem"]')
      : target.closest('[role="menuitemradio"], [role="menuitemcheckbox"]')
  if (menuitem) commit(menuitem, details)
}

function updateChecked(details: Element) {
  for (const el of details.querySelectorAll('[role="menuitemradio"], [role="menuitemcheckbox"]')) {
    const input = el.querySelector('input[type="radio"], input[type="checkbox"]')
    if (!(input instanceof HTMLInputElement)) continue
    el.setAttribute('aria-checked', input.checked.toString())
  }
}

function commit(selected: Element, details: Element) {
  if (selected.hasAttribute('disabled') || selected.getAttribute('aria-disabled') === 'true') return

  const dispatched = selected.dispatchEvent(new CustomEvent('details-menu-select', {bubbles: true, cancelable: true}))
  if (!dispatched) return

  updateLabel(selected, details)
  updateChecked(details)
  if (selected.getAttribute('role') !== 'menuitemcheckbox') close(details)
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
      {
        const target = sibling(details, true)
        if (target) target.focus()
        event.preventDefault()
      }
      break
    case 'ArrowUp':
      {
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
  ;(details: any).open = false
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
