/// <reference types="astro/client" />
/// <reference types="node" />
declare namespace App {
  interface Locals {
    user: import('./lib/auth').SessionUser | null;
    lang: import('./i18n').Lang;
  }
}
