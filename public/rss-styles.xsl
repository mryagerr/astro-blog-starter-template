<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body {
            font-family: 'Source Serif 4', Georgia, serif;
            background: #f7f5f0;
            color: #1a1a18;
            margin: 0;
            padding: 0;
          }
          a { color: #0891b2; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .page-header {
            background: #fff;
            border-bottom: 1px solid #d4cfc6;
            padding: 2rem clamp(1.5rem, 5vw, 4rem);
          }
          .page-header-inner {
            max-width: 720px;
            margin: 0 auto;
          }
          .rss-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fff;
            background: #0891b2;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            margin-bottom: 1rem;
          }
          h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.5rem, 4vw, 2rem);
            font-weight: 700;
            margin: 0 0 0.5rem;
            letter-spacing: -0.02em;
          }
          .description {
            font-size: 0.95rem;
            color: #7a7568;
            margin: 0 0 1.25rem;
            line-height: 1.6;
          }
          .how-to {
            background: #e0f2fe;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            color: #0e7490;
          }
          .how-to strong { color: #0891b2; }
          .how-to code {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.82em;
            background: rgba(8,145,178,0.1);
            padding: 0.1em 0.35em;
            border-radius: 3px;
            word-break: break-all;
          }
          .feed-link {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.8rem;
          }
          main {
            max-width: 720px;
            margin: 0 auto;
            padding: 2.5rem clamp(1.5rem, 5vw, 4rem);
          }
          .section-label {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #7a7568;
            margin-bottom: 1.25rem;
          }
          .item {
            border-bottom: 1px solid #d4cfc6;
            padding: 1.4rem 0;
          }
          .item:first-of-type { padding-top: 0; }
          .item:last-of-type { border-bottom: none; }
          .item-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0 0 0.35rem;
            line-height: 1.35;
          }
          .item-title a:hover { color: #0891b2; }
          .item-title a { color: #1a1a18; }
          .item-meta {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.72rem;
            color: #7a7568;
            margin-bottom: 0.5rem;
          }
          .item-desc {
            font-size: 0.9rem;
            color: #4a4940;
            line-height: 1.65;
            margin: 0;
          }
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.85rem;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            color: #0891b2;
            margin-top: 2.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #d4cfc6;
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="page-header-inner">
            <div class="rss-badge">&#9656; RSS Feed</div>
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
            <div class="how-to">
              <strong>Subscribe to this feed</strong> — copy the URL below into your RSS reader (Feedly, NetNewsWire, Reeder, etc.):<br/>
              <code class="feed-link"><xsl:value-of select="/rss/channel/link"/>rss.xml</code>
            </div>
          </div>
        </div>
        <main>
          <p class="section-label">Latest Articles</p>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <h2 class="item-title">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <p class="item-meta"><xsl:value-of select="pubDate"/></p>
              <p class="item-desc"><xsl:value-of select="description"/></p>
            </div>
          </xsl:for-each>
          <a class="back-link" href="/">&#8592; Back to Low Hanging Data</a>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
