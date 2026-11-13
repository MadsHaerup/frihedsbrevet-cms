import alignCenterHorizontal from '@phosphor-icons/core/assets/regular/align-center-horizontal.svg?raw';
import alignTop from '@phosphor-icons/core/assets/regular/align-top.svg?raw';
import arrowSquareOut from '@phosphor-icons/core/assets/regular/arrow-square-out.svg?raw';
import arrowUp from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import arrowsClockwise from '@phosphor-icons/core/assets/regular/arrows-clockwise.svg?raw';
import arrowsInLineHorizontal from '@phosphor-icons/core/assets/regular/arrows-in-line-horizontal.svg?raw';
import arrowsOut from '@phosphor-icons/core/assets/regular/arrows-out.svg?raw';
import arrowsOutLineHorizontal from '@phosphor-icons/core/assets/regular/arrows-out-line-horizontal.svg?raw';
import caretDown from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
import columns from '@phosphor-icons/core/assets/regular/columns.svg?raw';
import cornersOut from '@phosphor-icons/core/assets/regular/corners-out.svg?raw';
import dotsSix from '@phosphor-icons/core/assets/regular/dots-six.svg?raw';
import dotsSixVertical from '@phosphor-icons/core/assets/regular/dots-six-vertical.svg?raw';
import eye from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import facebookLogo from '@phosphor-icons/core/assets/regular/facebook-logo.svg?raw';
import frameCorners from '@phosphor-icons/core/assets/regular/frame-corners.svg?raw';
import image from '@phosphor-icons/core/assets/regular/image.svg?raw';
import instagramLogo from '@phosphor-icons/core/assets/regular/instagram-logo.svg?raw';
import layout from '@phosphor-icons/core/assets/regular/layout.svg?raw';
import link from '@phosphor-icons/core/assets/regular/link.svg?raw';
import linkedinLogo from '@phosphor-icons/core/assets/regular/linkedin-logo.svg?raw';
import listBullets from '@phosphor-icons/core/assets/regular/list-bullets.svg?raw';
import listNumbers from '@phosphor-icons/core/assets/regular/list-numbers.svg?raw';
import magnifyingGlass from '@phosphor-icons/core/assets/regular/magnifying-glass.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import quotes from '@phosphor-icons/core/assets/regular/quotes.svg?raw';
import rows from '@phosphor-icons/core/assets/regular/rows.svg?raw';
import sidebar from '@phosphor-icons/core/assets/regular/sidebar.svg?raw';
import splitVertical from '@phosphor-icons/core/assets/regular/square-split-vertical.svg?raw';
import textAa from '@phosphor-icons/core/assets/regular/text-aa.svg?raw';
import trash from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import xIcon from '@phosphor-icons/core/assets/regular/x.svg?raw';
import xLogo from '@phosphor-icons/core/assets/regular/x-logo.svg?raw';

const ICONS = {
  stack: rows,
  'grid-2': splitVertical,
  'grid-3': columns,
  'grid-side': sidebar,
  flex: layout,
  normal: arrowsInLineHorizontal,
  wide: arrowsOutLineHorizontal,
  full: cornersOut,
  replace: arrowsClockwise,
  rounded: frameCorners,
  remove: trash,
  col: plus,
  parent: arrowUp,
  center: alignCenterHorizontal,
  start: alignTop,
  close: xIcon,
  preview: eye,
  fullscreen: arrowsOut,
  external: arrowSquareOut,
  grip: dotsSixVertical,
  'grip-side': dotsSix,
  ul: listBullets,
  ol: listNumbers,
  quote: quotes,
  dropcap: textAa,
  link,
  image,
  plus,
  caret: caretDown,
  search: magnifyingGlass,
  facebook: facebookLogo,
  x: xLogo,
  instagram: instagramLogo,
  linkedin: linkedinLogo,
};

export type IconName = keyof typeof ICONS;

/** Phosphor regular icon, sized in pixels. `cls` lands on the svg. */
export function icon(name: IconName, size = 16, cls?: string): string {
  const attrs = [`width="${size}"`, `height="${size}"`, 'aria-hidden="true"'];
  if (cls) attrs.push(`class="${cls}"`);
  return ICONS[name].replace('<svg ', `<svg ${attrs.join(' ')} `);
}
