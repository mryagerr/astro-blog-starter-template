/**
 * Determines whether a nav link href should be considered "active" given
 * the current page pathname and the site's BASE_URL.
 *
 * A link is active when:
 *   - Its href exactly matches the current pathname (after stripping BASE_URL), or
 *   - Its href matches the top-level path segment (so /blog is active on /blog/my-post)
 */
export function isActiveLink(
	href: string | undefined,
	rawPathname: string,
	baseUrl: string,
): boolean {
	if (href === undefined) return false;
	const pathname = rawPathname.replace(baseUrl, '');
	// Normalize trailing slashes so /article and /article/ are treated the same
	const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);
	const normalizedHref = normalize(href);
	const normalizedPathname = normalize(pathname);
	const subpath = normalizedPathname.match(/[^\/]+/g);
	return normalizedHref === normalizedPathname || normalizedHref === '/' + (subpath?.[0] ?? '');
}
