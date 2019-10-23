export default class DetailsMenuElement extends HTMLElement {
  preload: boolean;
  src: string;
  clearFocus(): void;
  selectFocusOrFirst(): void;
}

declare global {
  interface Window {
    DetailsMenuElement: typeof DetailsMenuElement
  }
}
