var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _CustomElement() {
  return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
}

;
Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(_CustomElement, HTMLElement);
var typing = null;
var typingTimeoutID = null;

var DetailsMenuElement = function (_CustomElement2) {
  _inherits(DetailsMenuElement, _CustomElement2);

  function DetailsMenuElement() {
    _classCallCheck(this, DetailsMenuElement);

    return _possibleConstructorReturn(this, (DetailsMenuElement.__proto__ || Object.getPrototypeOf(DetailsMenuElement)).call(this));
  }

  _createClass(DetailsMenuElement, [{
    key: 'connectedCallback',
    value: function connectedCallback() {
      var _this2 = this;

      this.setAttribute('role', 'menu');

      var details = this.parentElement;
      if (!details) return;

      var summary = details.querySelector('summary');
      if (summary) summary.setAttribute('aria-haspopup', 'menu');

      details.addEventListener('click', clicked);
      details.addEventListener('keydown', keydown);
      details.addEventListener('toggle', function () {
        if (!_this2.src) return;
        var loader = _this2.querySelector('include-fragment');
        if (loader) {
          loader.addEventListener('loadend', focusInput.bind(null, details));
          loader.src = _this2.src;
        }
      }, { once: true });

      details.addEventListener('toggle', closeCurrentMenu);
      details.addEventListener('toggle', focusInput.bind(null, details));
    }
  }, {
    key: 'src',
    get: function get() {
      return this.getAttribute('src') || '';
    },
    set: function set(value) {
      this.setAttribute('src', value);
    }
  }]);

  return DetailsMenuElement;
}(_CustomElement);

function closeCurrentMenu(event) {
  var el = event.currentTarget;
  if (!(el instanceof Element)) return;
  if (!el.hasAttribute('open')) return;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = document.querySelectorAll('details[open] > details-menu')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var menu = _step.value;

      var opened = menu.closest('details');
      if (opened && opened !== el && !opened.contains(el)) {
        opened.removeAttribute('open');
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function focusInput(details) {
  if (!details.open) return;
  var input = details.querySelector('[autofocus]');
  if (input) {
    input.focus();
  }
}

function handleTyping(event) {
  var summary = event.currentTarget;
  if (!(summary instanceof HTMLElement)) return;
  var details = summary.closest('details');
  if (!details) return;
  if (!event.key.match(/^[A-z0-9]{1}$/)) {
    typing = null;
    return;
  }

  if (!typing) typing = '^';
  if (!event.metaKey && !event.ctrlKey && !event.shiftKey) typing += event.key;

  if (typingTimeoutID) {
    clearTimeout(typingTimeoutID);
    typingTimeoutID = null;
  }

  typingTimeoutID = setTimeout(function () {
    typing = null;
  }, 500);
  var target = findElementByString(details, new RegExp(typing, 'i'));
  if (target) {
    details.setAttribute('open', 'open');
    target.focus();
  }
}

function menuitems(details) {
  return details.querySelectorAll('[role^="menuitem"]:not([hidden]):not([disabled]):not([aria-disabled="true"])');
}

function findElementByString(details, regex) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = menuitems(details)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var item = _step2.value;

      if (item.textContent.match(regex)) return item;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

function sibling(details, next) {
  var options = Array.from(menuitems(details));
  var selected = document.activeElement;
  var index = options.indexOf(selected);
  var sibling = next ? options[index + 1] : options[index - 1];
  var def = next ? options[0] : options[options.length - 1];
  return sibling || def;
}

var ctrlBindings = navigator.userAgent.match(/Macintosh/);

function clicked(event) {
  var target = event.target;
  if (!(target instanceof Element)) return;

  var details = event.currentTarget;
  if (!(details instanceof Element)) return;

  // Ignore clicks from nested details.
  if (target.closest('details') !== details) return;

  var item = target.closest('[role^="menuitem"]');
  if (item) commit(item, details);
}

function isCheckable(el) {
  var role = el.getAttribute('role');
  return role === 'menuitemradio' || role === 'menuitemcheckbox';
}

function updateChecked(selected, details) {
  if (!isCheckable(selected)) return;

  if (selected.getAttribute('role') === 'menuitemradio') {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = details.querySelectorAll('[role="menuitemradio"]')[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var el = _step3.value;

        el.setAttribute('aria-checked', 'false');
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
  selected.setAttribute('aria-checked', 'true');
}

function commit(selected, details) {
  if (selected.hasAttribute('disabled') || selected.getAttribute('aria-disabled') === 'true') return;

  var dispatched = selected.dispatchEvent(new CustomEvent('details-menu-select', { bubbles: true, cancelable: true }));
  if (!dispatched) return;

  updateLabel(selected, details);
  updateChecked(selected, details);
  if (selected.getAttribute('role') !== 'menuitemcheckbox') close(details);
  selected.dispatchEvent(new CustomEvent('details-menu-selected', { bubbles: true }));
}

function keydown(event) {
  var details = event.currentTarget;

  // Ignore key presses from nested details.
  if (details.querySelector('details[open]')) return;

  switch (event.key) {
    case 'Escape':
      close(details);
      event.preventDefault();
      break;
    case 'ArrowDown':
      {
        var target = sibling(details, true);
        if (target) target.focus();
        event.preventDefault();
      }
      break;
    case 'ArrowUp':
      {
        var _target = sibling(details, false);
        if (_target) _target.focus();
        event.preventDefault();
      }
      break;
    case 'n':
      {
        if (ctrlBindings && event.ctrlKey) {
          var _target2 = sibling(details, true);
          if (_target2) _target2.focus();
          event.preventDefault();
        }
      }
      break;
    case 'p':
      {
        if (ctrlBindings && event.ctrlKey) {
          var _target3 = sibling(details, false);
          if (_target3) _target3.focus();
          event.preventDefault();
        }
      }
      break;
    case ' ':
    case 'Enter':
      {
        var selected = document.activeElement;
        if (selected && isMenuItem(selected) && selected.closest('details') === details) {
          event.preventDefault();
          event.stopPropagation();
          selected.click();
        }
      }
      break;
    default:
      handleTyping(event);
  }
}

function isMenuItem(el) {
  var role = el.getAttribute('role');
  return role === 'menuitem' || role === 'menuitemcheckbox' || role === 'menuitemradio';
}

function close(details) {
  ;details.open = false;
  var summary = details.querySelector('summary');
  if (summary) summary.focus();
}

function updateLabel(item, details) {
  var button = details.querySelector('[data-menu-button]');
  if (!button) return;

  var text = labelText(item);
  if (text) {
    button.textContent = text;
  } else {
    var html = labelHTML(item);
    if (html) button.innerHTML = html;
  }
}

function labelText(el) {
  if (!el) return null;
  var textEl = el.hasAttribute('data-menu-button-text') ? el : el.querySelector('[data-menu-button-text]');

  if (!textEl) return null;
  return textEl.getAttribute('data-menu-button-text') || textEl.textContent;
}

function labelHTML(el) {
  if (!el) return null;
  var contentsEl = el.hasAttribute('data-menu-button-contents') ? el : el.querySelector('[data-menu-button-contents]');

  return contentsEl ? contentsEl.innerHTML : null;
}

export default DetailsMenuElement;

if (!window.customElements.get('details-menu')) {
  window.DetailsMenuElement = DetailsMenuElement;
  window.customElements.define('details-menu', DetailsMenuElement);
}
