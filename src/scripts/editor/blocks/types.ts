export interface BlockHooks {
  tr: (key: string) => string;
  markDirty: () => void;
  /** open the image dialog pre-filled for this figure */
  replaceImage: (figure: HTMLElement) => void;
}

export type ActApi = {
  pick: (el: HTMLElement | null) => void;
  clear: () => void;
  hide: () => void;
  replace: (el: HTMLElement) => void;
};
