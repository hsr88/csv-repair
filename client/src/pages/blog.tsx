import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { FileSpreadsheet, Calendar, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader, PageFooter } from "@/components/navigation";
import { blogPosts, getBlogPost } from "@/data/blog-posts";

function renderMarkdown(content: string) {
  const blocks: { type: string; content: string; level?: number }[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4) });
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3) });
      i++;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n") });
      i++;
    } else if (line.startsWith("| ")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[-\s|]+\|$/)) {
          tableLines.push(lines[i]);
        }
        i++;
      }
      blocks.push({ type: "table", content: JSON.stringify(tableLines) });
    } else if (line.startsWith("- **") || line.startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", content: JSON.stringify(listItems) });
    } else if (line.trim() === "") {
      i++;
    } else {
      const paraLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("```") && !lines[i].startsWith("- ") && !lines[i].startsWith("|")) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "p", content: paraLines.join(" ") });
    }
  }

  return blocks;
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g);
  const elements: (string | JSX.Element)[] = [];
  let key = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith("**") && part.endsWith("**")) {
      elements.push(<strong key={key++} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      elements.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground">{part.slice(1, -1)}</code>);
    } else if (part.startsWith("[")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const isInternal = match[2].startsWith("/") || match[2].includes("csv.repair");
        if (isInternal && (match[2] === "https://csv.repair" || match[2] === "https://csv.repair/")) {
          elements.push(<Link key={key++} href="/"><span className="text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer">{match[1]}</span></Link>);
        } else {
          elements.push(<a key={key++} href={match[2]} className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{match[1]}</a>);
        }
      } else {
        elements.push(part);
      }
    } else {
      // Don't duplicate text if it was extracted as a capture group in `part.split(...)`
      if (i > 0 && parts[i - 1]?.startsWith("[")) {
        const prevMatch = parts[i - 1].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (prevMatch && (part === prevMatch[1] || part === prevMatch[2])) continue;
      }
      elements.push(part);
    }
  }

  return <>{elements}</>;
}

function ArticleContent({ content }: { content: string }) {
  const blocks = renderMarkdown(content);

  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return <h2 key={i} className="text-xl sm:text-2xl font-bold text-foreground mt-10 mb-3" id={block.content.toLowerCase().replace(/[^a-z0-9]+/g, "-")}><InlineFormat text={block.content} /></h2>;
        }
        if (block.type === "h3") {
          return <h3 key={i} className="text-lg sm:text-xl font-semibold text-foreground mt-8 mb-2"><InlineFormat text={block.content} /></h3>;
        }
        if (block.type === "code") {
          return (
            <div key={i} className="rounded-lg bg-muted/60 border border-border overflow-x-auto">
              <pre className="p-4 text-sm font-mono text-foreground leading-relaxed whitespace-pre">{block.content}</pre>
            </div>
          );
        }
        if (block.type === "table") {
          const rows: string[] = JSON.parse(block.content);
          const parseRow = (row: string) => row.split("|").filter(Boolean).map((c: string) => c.trim());
          const headers = parseRow(rows[0]);
          const dataRows = rows.slice(1).map(parseRow);
          return (
            <div key={i} className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    {headers.map((h, j) => <th key={j} className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, j) => (
                    <tr key={j} className="border-b border-border last:border-0">
                      {row.map((cell, k) => <td key={k} className="px-3 py-2 text-muted-foreground"><InlineFormat text={cell} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "ul") {
          const items: string[] = JSON.parse(block.content);
          return (
            <ul key={i} className="space-y-2 pl-5">
              {items.map((item, j) => (
                <li key={j} className="text-muted-foreground leading-relaxed list-disc"><InlineFormat text={item} /></li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-muted-foreground leading-relaxed"><InlineFormat text={block.content} /></p>;
      })}
    </div>
  );
}

function BlogListPage() {
  useEffect(() => {
    document.title = "Blog — csv.repair | CSV Tips, Guides & Data Cleaning Tutorials";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Practical guides and tutorials on fixing broken CSV files, data cleaning, CSV encoding issues, and working with large datasets. Tips from the csv.repair team.");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PageHeader />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-2">
          <FileSpreadsheet className="w-7 h-7 text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold">Blog</h1>
        </div>
        <p className="text-muted-foreground mb-8 sm:mb-10">Guides, tutorials, and tips for working with CSV files.</p>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="group block p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-blue-500/30 transition-all cursor-pointer" data-testid={`blog-card-${post.slug}`}>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-blue-400 transition-colors mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{post.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readingTime}</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-blue-400 font-medium">
                  Read more <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

function BlogArticlePage({ slug }: { slug: string }) {
  const post = getBlogPost(slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — csv.repair Blog`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", post.description);
    } else {
      document.title = "Article Not Found — csv.repair Blog";
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
            <Link href="/blog"><span className="text-blue-400 hover:text-blue-300 underline cursor-pointer">← Back to Blog</span></Link>
          </div>
        </div>
        <PageFooter />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: "hsr88", url: "https://github.com/hsr88" },
    publisher: { "@type": "Organization", name: "csv.repair", url: "https://csv.repair" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://csv.repair/blog/${post.slug}` },
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PageHeader />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-10">
        <Link href="/blog">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </span>
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4" data-testid="article-title">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readingTime}</span>
          </div>
        </header>

        <ArticleContent content={post.content} />

        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">More Articles</h3>
          <div className="space-y-3">
            {blogPosts.filter((p) => p.slug !== post.slug).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}>
                <div className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer py-1" data-testid={`related-${p.slug}`}>
                  <ChevronRight className="w-3.5 h-3.5" />
                  {p.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </article>
      <PageFooter />
    </div>
  );
}

export default function BlogPage() {
  const params = useParams<{ slug?: string }>();
  if (params.slug) {
    return <BlogArticlePage slug={params.slug} />;
  }
  return <BlogListPage />;
}
