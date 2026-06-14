import type { Metadata } from "next";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  canonical?: string;
}

/**
 * Generate metadata for dynamic pages
 * Usage: export const metadata = generateMetadata(seoProps)
 */
export function generateMetadata(props: SEOProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const image = props.image ? `${baseUrl}${props.image}` : `${baseUrl}/og-image.jpg`;
  const canonical = props.canonical || `${baseUrl}${props.url || ""}`;

  return {
    title: props.title,
    description: props.description,
    keywords: props.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: props.title,
      description: props.description,
      url: canonical,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: props.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: props.title,
      description: props.description,
      images: [image],
    },
  };
}

/**
 * Generate structured data for articles and content
 */
export function generateArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author = "StreamZone",
}: {
  title: string;
  description: string;
  image?: string;
  datePublished: Date;
  dateModified: Date;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image,
    author: {
      "@type": "Organization",
      name: author,
    },
    datePublished: datePublished.toISOString(),
    dateModified: dateModified.toISOString(),
  };
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}
