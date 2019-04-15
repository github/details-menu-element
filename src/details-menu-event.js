/* @flow strict */

type DetailsMenuType = 'details-menu-select' | 'details-menu-selected'

type DetailsMenu$Init = CustomEvent$Init & {
  relatedTarget: Element
}

export default class DetailsMenuEvent extends CustomEvent {
  relatedTarget: Element

  constructor(type: DetailsMenuType, init: DetailsMenu$Init) {
    super(type, init)
    this.relatedTarget = init.relatedTarget
  }
}
