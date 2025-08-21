declare module 'canvg' {
  export interface CanvgOptions {
    ignoreDimensions?: boolean;
    [key: string]: unknown;
  }

  export class Canvg {
    static from(
      ctx: CanvasRenderingContext2D,
      svg: string,
      options?: CanvgOptions
    ): Promise<Canvg>;

    width?: number;
    height?: number;

    resize(width: number, height: number, preserveAspectRatio?: string): void;
    render(): Promise<void>;
  }
}


