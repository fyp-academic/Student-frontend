import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

const SITE_NAME = "APES eLearning";
const BASE_URL = "https://apesudom.codagenz.com";
const DEFAULT_DESCRIPTION =
  "APES is an AI-powered personalized eLearning system. Smart course recommendations, live sessions, AI study tips, and adaptive learning tools — all in one platform. welcome!";

export function SEOHead({ title, description, canonical, noIndex = false }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – AI Personalization eLearning System`;
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
