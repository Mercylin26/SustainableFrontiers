declare module 'qrious' {
  export interface QRiousOptions {
    background?: string;
    backgroundAlpha?: number;
    foreground?: string;
    foregroundAlpha?: number;
    level?: string;
    mime?: string;
    padding?: number;
    size?: number;
    value?: string;
  }

  export default class QRious {
    constructor(options?: QRiousOptions);
    set(options: QRiousOptions): this;
    toDataURL(mime?: string): string;
    toString(): string;
  }
}