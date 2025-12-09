/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module 'next' {
  interface Image {
    unoptimized?: boolean
  }
}

export {}
