import { IconCar, IconRoute, IconSearch, IconShield, IconTag, IconUser } from './icons.tsx';
import { NavLink } from './nav-link.tsx';

const items = [
  { href: '/', label: 'Inicio', icon: <IconCar /> },
  { href: '/autos', label: 'Autos', icon: <IconSearch /> },
  { href: '/vender', label: 'Vender', icon: <IconTag /> },
  { href: '/#como-funciona', label: 'Cómo funciona', icon: <IconRoute /> },
  { href: '/#confianza', label: 'Sello', icon: <IconShield /> },
  { href: '/mis-anuncios', label: 'Cuenta', icon: <IconUser /> },
];

export function SideNav() {
  return (
    <nav className="side" aria-label="Principal">
      {items.map((i) => (
        <NavLink key={i.href} href={i.href} label={i.label} className="side-link">
          {i.icon}
        </NavLink>
      ))}
    </nav>
  );
}
