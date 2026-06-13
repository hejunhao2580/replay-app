/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

export const TypeConfig = {
  esbuild: "esbuild",
  vite: "vite",
} as const;

export type TypeConfig = (typeof TypeConfig)[keyof typeof TypeConfig];

export const Target = {
  main: 0,
  renderer: 1,
} as const;

export type Target = (typeof Target)[keyof typeof Target];
