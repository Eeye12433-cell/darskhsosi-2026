import { Helmet } from "react-helmet-async";

const SITE_URL = "https://dars-khsosy.lovable.app";

interface SeoProps {
  title: string;
  description: string;
  path: string;
}

/**
 * Per-route head tags: unique title, description, canonical and og:*.
 * Rendered inside each page component.
 */
const Seo = ({ title, description, path }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default Seo;
