export default class DetailsMenuElement extends HTMLElement {
  preload: boolean;
  src: string;
}

declare global {
  interface Window {
    DetailsMenuElement: typeof DetailsMenuElement
  }
}
