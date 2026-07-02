/**
 * Injected into the active tab when the user clicks "Analyze with FlipScout".
 * User-initiated capture of the page the user is already viewing — no
 * crawling, no background scraping (see DESIGN.md §1.3 and §6).
 *
 * Per-site DOM adapters go here as marketplaces are added; the generic
 * fallback below (og: meta tags + visible text + price regex) works
 * surprisingly often and is what ships in the prototype.
 */
(() => {
  const meta = (name) =>
    document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content ?? "";

  const host = location.hostname;
  const source = host.includes("facebook")
    ? "facebook"
    : host.includes("offerup")
      ? "offerup"
      : host.includes("craigslist")
        ? "craigslist"
        : host.includes("mercari")
          ? "mercari"
          : host.includes("jawa")
            ? "jawa"
            : "manual";

  const title =
    meta("og:title") || document.querySelector("h1")?.innerText || document.title;

  const bodyText = document.body.innerText.slice(0, 8000);
  const priceMatch = (title + "\n" + bodyText).match(/\$\s?([\d,]+(?:\.\d{2})?)/);
  const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null;

  return {
    source,
    url: location.href,
    title: title.trim().slice(0, 120),
    price,
    description: meta("og:description") || bodyText.slice(0, 3000),
  };
})();
