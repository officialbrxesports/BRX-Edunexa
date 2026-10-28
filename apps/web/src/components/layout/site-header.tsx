import Link from 'next/link';
import { en } from '@/lib/i18n/en';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label={en.brand.name}>
        <span className="brand-mark">B</span>
        <span className="brand-name">{en.brand.name}</span>
      </Link>

      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/">{en.navigation.home}</Link>
        <a href="#programs">{en.navigation.programs}</a>
        <a href="#campus">{en.navigation.campus}</a>
      </nav>

      <div className="header-actions">
        <Link href="/sign-in" className="sign-in-link">
          {en.navigation.signIn}
        </Link>
        <Link href="/sign-in" className="button button-small">
          {en.navigation.getStarted}
          <span aria-hidden="true"> ↗</span>
        </Link>
      </div>
    </header>
  );
}