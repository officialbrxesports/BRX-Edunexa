import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { en } from '@/lib/i18n/en';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero-section">
          <Image
            src="/images/hero/main-banner.jpg"
            alt={en.hero.imageAlt}
            fill
            priority
            sizes="100vw"
            className="hero-image"
          />

          <div className="hero-overlay" />

          <div className="hero-content">
            <span className="eyebrow">
              <span className="status-dot" />
              {en.hero.eyebrow}
            </span>

            <h1>
              {en.hero.title}
              <br />
              <span>{en.hero.highlight}</span>
            </h1>

            <p className="hero-description">{en.hero.description}</p>

            <div className="hero-actions">
              <Link href="#programs" className="button">
                {en.hero.primaryAction}
                <span aria-hidden="true"> ↗</span>
              </Link>
              <Link href="#campus" className="button button-outline">
                {en.hero.secondaryAction}
              </Link>
            </div>

            <div className="hero-note">
              <span className="hero-note-line" />
              {en.hero.badge}
            </div>
          </div>

          <div className="hero-index" aria-hidden="true">
            BRX <span> / </span> EDU
          </div>
        </section>

        <section className="programs-section" id="programs">
          <div className="section-heading">
            <div>
              <span className="section-kicker">{en.programs.eyebrow}</span>
              <h2>{en.programs.title}</h2>
            </div>
            <p>{en.programs.description}</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card feature-card-large" id="campus">
              <div className="feature-image-wrap">
                <Image
                  src="/images/campus/campus-1.jpg"
                  alt={en.programs.imageAlt}
                  fill
                  sizes="(max-width: 700px) 100vw, 60vw"
                  className="feature-image"
                />
              </div>
              <div className="feature-card-content">
                <span className="card-number">01 / CAMPUS</span>
                <h3>{en.programs.campusTitle}</h3>
                <p>{en.programs.campusDescription}</p>
              </div>
            </article>

            <article className="feature-card">
              <div className="feature-image-wrap">
                <Image
                  src="/images/courses/0535191d83b4a6bfa8310e3d4b534f54.jpg"
                  alt={en.programs.courseImageAlt}
                  fill
                  sizes="(max-width: 700px) 100vw, 40vw"
                  className="feature-image"
                />
              </div>
              <div className="feature-card-content">
                <span className="card-number">02 / PROGRAMS</span>
                <h3>{en.programs.coursesTitle}</h3>
                <p>{en.programs.coursesDescription}</p>
              </div>
            </article>

            <article className="feature-card">
              <div className="feature-image-wrap">
                <Image
                  src="/images/teachers/teacher-1.jpg"
                  alt={en.programs.teacherImageAlt}
                  fill
                  sizes="(max-width: 700px) 100vw, 40vw"
                  className="feature-image"
                />
              </div>
              <div className="feature-card-content">
                <span className="card-number">03 / COMMUNITY</span>
                <h3>{en.programs.teachersTitle}</h3>
                <p>{en.programs.teachersDescription}</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}