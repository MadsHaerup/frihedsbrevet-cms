import type { APIRoute } from 'astro';
import { endSession } from '../../lib/auth';

import { url } from '../../i18n';

const post: APIRoute = ({ cookies, redirect, locals }) => {
  endSession(cookies);
  return redirect(url(locals.lang, 'login'), 303);
};

export { post as POST };
