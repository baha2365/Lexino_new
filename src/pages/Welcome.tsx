import { Link } from 'react-router-dom';
import { Mascot } from '../components/Mascot';
import { useAuth } from '../lib/auth';

/** Where the confirmation link in the sign-up email lands. */
export function Welcome() {
  const auth = useAuth();
  // Supabase reports expired / reused links as ?error_description=... on the URL.
  const failed = new URLSearchParams(window.location.search).get('error_description');

  return (
    <div className="screen welcome">
      <header className="bar"><div className="brand">Lexino</div></header>
      <main className="stage">
        <div className="welcome__card">
          <div className="welcome__mascot"><Mascot /></div>
          {failed ? (
            <>
              <h1>That link has expired</h1>
              <p>Confirmation links work once and only for a short time. Create your account again or sign in to get a new one.</p>
              <Link className="pill" to="/adult/account">Back to sign in</Link>
            </>
          ) : (
            <>
              <h1>Email confirmed! 🎉</h1>
              <p>
                Welcome to Lexino{auth.name ? `, ${auth.name}` : ''}. Your account is ready.
                {auth.session ? ' You’re signed in.' : ' Sign in to continue.'}
              </p>
              <Link className="pill" to="/adult/account">
                {auth.session ? 'Set up my child' : 'Sign in'}
              </Link>
              <Link className="welcome__skip" to="/">Go to the games</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
