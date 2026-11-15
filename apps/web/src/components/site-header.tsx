import Link from 'next/link';
import { currentUser } from '../lib/session.ts';
import { IconPin } from './icons.tsx';
import { NavLink } from './nav-link.tsx';
import { SignOutButton } from './sign-out-button.tsx';

/** Marca (arriba a la izquierda) y barra superior: pestañas en píldora, ubicación y cuenta. */
export async function SiteHeader() {
  const user = await currentUser();
  return (
    <>
      <Link className="logo-cell" href="/" aria-label="Kuntur Autos, inicio">
        <img src="/icon.svg" width={34} height={34} alt="" />
      </Link>
      <header className="topbar">
        <Link className="brand-name" href="/" aria-hidden="true" tabIndex={-1}>
          Kuntur Autos
        </Link>
        <nav className="tabs" aria-label="Secciones">
          <NavLink href="/" label="Descubrir" className="tab">
            {null}
          </NavLink>
          <NavLink href="/autos" label="Autos" className="tab">
            {null}
          </NavLink>
          <NavLink href="/vender" label="Vender" className="tab">
            {null}
          </NavLink>
          <NavLink href="/#como-funciona" label="Cómo funciona" className="tab">
            {null}
          </NavLink>
        </nav>
        <div className="top-right">
          <Link className="pill pill-loc" href="/autos#filtros" title="Elegir departamento">
            <IconPin /> Todo el Perú
          </Link>
          {user ? (
            <>
              <span className="pill who">{user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <Link className="pill pill-solid" href="/ingresar">
              Ingresar
            </Link>
          )}
          <Link className="btn btn-primary btn-sm" href="/vender">
            <span>
              Vender<span className="nav-extra"> mi auto</span>
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}
