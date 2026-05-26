import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

const SITE_NAME = "APES UDOM";
const BASE_URL = "https://apesudom.codagenz.com";
const DEFAULT_DESCRIPTION =
  "APES UDOM is the official Learning Management System for University of Dodoma students. Browse courses, attend live sessions, submit assignments, and track your academic progress.";

export function SEOHead({ title, description, canonical, noIndex = false }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – University of Dodoma Student Portal`;
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </Helmet>
  );
}
