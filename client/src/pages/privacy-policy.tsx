import { useEffect } from "react";
import { Shield } from "lucide-react";
import { PageHeader, PageFooter } from "@/components/navigation";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy - csv.repair | CSV Repair Tool";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Privacy policy for csv.repair. All CSV processing happens locally in your browser. Your files are never uploaded to any server.");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              This Privacy Policy describes how csv.repair ("we", "us", "our") collects, uses, and protects information when you use our web application. We are committed to ensuring that your privacy is protected and that we are transparent about the data we collect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Data Processing</h2>
            <p>
              csv.repair is a client-side application. All CSV file processing — including parsing, editing, querying, and exporting — happens entirely in your web browser. <strong>Your CSV files are never uploaded to our servers, stored in any cloud service, or transmitted over the internet.</strong> We do not have access to the content of your files at any time.
            </p>
            <p>
              Any data you load into csv.repair remains in your browser's memory and is discarded when you close the tab or navigate away from the page. We do not use cookies to store any of your file data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Analytics</h2>
            <p>
              We use <strong>Google Analytics</strong> to collect anonymous usage data about how visitors interact with our website. This helps us understand how the tool is used and how we can improve it. Google Analytics may collect the following information:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li>Pages visited and time spent on each page</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Screen resolution</li>
              <li>Geographic location (country/region level, not precise location)</li>
              <li>Referring website or source</li>
              <li>Device type (desktop, mobile, tablet)</li>
            </ul>
            <p className="mt-3">
              This data is collected anonymously and aggregated. It does not include any personally identifiable information (PII), and it does not include any content from CSV files you process in the tool. Google Analytics uses cookies to collect this information. You can opt out of Google Analytics tracking by using a browser extension such as the <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" data-testid="link-ga-optout">Google Analytics Opt-out Browser Add-on</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Local Storage</h2>
            <p>
              csv.repair uses your browser's local storage to save your theme preference (dark or light mode). This data is stored only on your device and is not transmitted to any server.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Third-Party Services</h2>
            <p>
              Besides Google Analytics, csv.repair does not integrate with any third-party services that collect user data. We do not use advertising networks, social media trackers, or any other third-party analytics tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Security</h2>
            <p>
              Since your CSV data is processed entirely in your browser, the security of your data depends on your local environment. We recommend using csv.repair on a trusted device with up-to-date browser software. We serve our application over HTTPS to ensure the integrity and confidentiality of the application code delivered to your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Children's Privacy</h2>
            <p>
              csv.repair is not directed at children under the age of 13. We do not knowingly collect any personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or about how csv.repair handles your data, please contact us through GitHub:
            </p>
            <p className="mt-2">
              <a
                href="https://github.com/hsr88"
                className="text-blue-500 hover:underline inline-flex items-center gap-1.5"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-github-contact"
              >
                github.com/hsr88
              </a>
            </p>
          </section>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}
