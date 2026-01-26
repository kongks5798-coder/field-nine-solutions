declare module 'html-to-image' {
  export interface Options {
    quality?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (domNode: HTMLElement) => boolean;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    pixelRatio?: number;
    skipAutoScale?: boolean;
    fontEmbedCSS?: string;
    preferredFontFormat?: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'embedded-opentype' | 'svg';
    includeQueryParams?: boolean;
    skipFonts?: boolean;
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob | null>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
}
