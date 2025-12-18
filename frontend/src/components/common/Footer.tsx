import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={ROUTES.TERMS_OF_SERVICE}
              className="hover:text-foreground transition-colors"
            >
              CGU
            </Link>
            <span className="hidden md:inline text-muted-foreground/50">•</span>
            <Link
              to={ROUTES.PRIVACY_POLICY}
              className="hover:text-foreground transition-colors"
            >
              Politique de confidentialité
            </Link>
            <span className="hidden md:inline text-muted-foreground/50">•</span>
            <Link
              to={ROUTES.LEGAL_NOTICE}
              className="hover:text-foreground transition-colors"
            >
              Mentions légales
            </Link>
          </nav>

          {/* Developer Credit */}
          <div className="text-center md:text-right">
            <span>Développé par </span>
            <a
              href="mailto:mael.michaud@codeforgestudio.fr"
              className="hover:text-foreground transition-colors font-medium"
            >
              mael.michaud@codeforgestudio.fr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
