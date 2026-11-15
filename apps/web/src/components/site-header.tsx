import { currentUser } from '../lib/session.ts';
import { SignOutButton } from './sign-out-button.tsx';

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="bar">
      <a className="brand" href="/" aria-label="Kuntur Autos, inicio">
        <img src="/icon.svg" width={36} height={36} alt="" />
        <span>Kuntur Autos</span>
      </a>
      <nav aria-label="Principal">
        <a href="/#como-funciona">Cómo funciona</a>
        <a href="/vender">Vender</a>
        {user ? (
          <>
            <span className="who">{user.name}</span>
            <SignOutButton />
          </>
        ) : (
          <a href="/ingresar">Ingresar</a>
        )}
      </nav>
    </header>
  );
}
