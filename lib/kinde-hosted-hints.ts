import type { LoginMethodParams } from '@kinde/js-utils';

/** Runtime Kinde login options may include `authUrlParams`; typings can lag behind SDK releases. */
export type KindeHostedLoginHint = LoginMethodParams & {
  authUrlParams?: Record<string, string>;
};

/** OAuth params for Kinde hosted **registration** (not sign-in lookup). */

export function buildKindeRegisterHint(options: {
  email?: string;

  emailConnectionId?: string;
}): KindeHostedLoginHint {
  const authUrlParams: Record<string, string> = { prompt: 'create' };

  const hint: KindeHostedLoginHint = { authUrlParams };



  if (options.emailConnectionId) {

    hint.connectionId = options.emailConnectionId;

  }



  // Pre-fill email on the sign-up path only when using a dedicated email connection.

  if (options.emailConnectionId && options.email?.includes('@')) {

    authUrlParams.login_hint = options.email.trim().toLowerCase();

  }



  return hint;

}



/**

 * Google / Facebook / Apple via Kinde `register` + optional connectionId.

 * Skips the generic "Welcome back" landing when connectionId is set.

 */

export function buildKindeSocialRegisterHint(connectionId?: string): KindeHostedLoginHint {
  const hint: KindeHostedLoginHint = { authUrlParams: { prompt: 'create' } };

  if (connectionId) {

    hint.connectionId = connectionId;

  }

  return hint;

}



/** Social sign-in for returning users (no `prompt=create`). */

export function buildKindeSocialSignInHint(connectionId?: string): KindeHostedLoginHint {

  const hint: KindeHostedLoginHint = {};

  if (connectionId) {

    hint.connectionId = connectionId;

  }

  return hint;

}



/** OAuth params for Kinde hosted **sign-in**. */

export function buildKindeSignInHint(options: {

  email?: string;

  emailConnectionId?: string;

}): KindeHostedLoginHint | undefined {
  const authUrlParams: Record<string, string> = {};

  const hint: KindeHostedLoginHint = {};



  if (options.emailConnectionId) {

    hint.connectionId = options.emailConnectionId;

  }

  if (options.email?.includes('@')) {

    authUrlParams.login_hint = options.email.trim().toLowerCase();

  }

  if (Object.keys(authUrlParams).length > 0) {

    hint.authUrlParams = authUrlParams;

  }



  if (!hint.connectionId && !hint.authUrlParams) {

    return undefined;

  }

  return hint;

}

