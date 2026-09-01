import { Shield } from "lucide-react";
import { Link } from "@/lib/router-compat";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display tracking-wider">
            <Shield className="w-5 h-5 text-primary" />
            <span>Onsight Martin</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-display tracking-wide text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: August 12, 2026</p>

        <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-display text-foreground mb-2">1. Overview</h2>
            <p>
              Onsight Martin ("we", "us", or "our") operates the website at
              onsightmartin.com and the Ticklelist mobile app. This policy
              explains what data we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">2. Accounts & Authentication</h2>
            <p>
              When you create a Ticklelist account, we collect your email
              address and display name. Authentication is handled by our backend
              provider (Supabase). We do not store passwords directly — only a
              secure hash managed by the auth provider.
            </p>
            <p className="mt-2">
              You may sign in with Google OAuth. We receive your name and email
              from Google but do not access your Google contacts or other Google
              data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">3. Content You Upload</h2>
            <p>
              If you log ascents, post comments, upload photos, or customize an
              avatar, that content is stored on our servers and associated with
              your account. Photos you upload are stored in our file storage and
              may be publicly visible if you choose to share them on your profile
              or in the activity feed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">4. Location Data</h2>
            <p>
              The Ticklelist app does not track your location automatically.
              Location data shown on the "Where is Martin?" map is Martin's
              GPS-tracked van location, not yours. Community members do not share
              their location unless they voluntarily include it in a post or
              profile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">5. Analytics & Cookies</h2>
            <p>
              We use lightweight analytics to count page views and understand
              traffic patterns. A visitor counter tracks total site visits
              without identifying individuals. We do not sell or share
              analytics data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">6. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Supabase</strong> — authentication and database hosting</li>
              <li><strong>Google</strong> — OAuth sign-in, YouTube embeds, Google Play</li>
              <li><strong>YouTube</strong> — embedded video content</li>
              <li><strong>Leaflet / OpenStreetMap</strong> — map rendering</li>
            </ul>
            <p className="mt-2">
              Each third party has its own privacy policy. We only share the
              minimum data needed to provide these services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">7. Your Rights</h2>
            <p>
              You can request a copy of your data, correct it, or delete your
              account at any time. To exercise these rights, contact us at
              <a href="mailto:hello@onsightmartin.com" className="text-primary hover:underline"> hello@onsightmartin.com</a>.
              Deleting your account removes your profile, ascents, comments, and
              uploaded photos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">8. Children's Privacy</h2>
            <p>
              Ticklelist is not directed at children under 13. We do not
              knowingly collect data from anyone under 13. If you believe a
              minor has registered, contact us and we will delete the account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">9. Changes</h2>
            <p>
              We may update this policy as the app evolves. We will post the
              updated version here with a new date. Continued use after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground mb-2">10. Contact</h2>
            <p>
              Questions about this policy? Email
              <a href="mailto:hello@onsightmartin.com" className="text-primary hover:underline"> hello@onsightmartin.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Back to Onsight Martin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
