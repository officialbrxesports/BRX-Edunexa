import Link from 'next/link';
import { en } from '@/lib/i18n/en';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" className="brand">
        <span className="brand-mark">B</span>
        <span className="brand-name">{en.brand.name}</span>
      </Link>

      <p>{en.footer.description}</p>

      <span className="footer-copyright">
        © {new Date().getFullYear()} {en.footer.copyright}
      </span>
    </footer>
  );
}