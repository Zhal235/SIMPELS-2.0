declare module '*.jpg';
declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.gif';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}