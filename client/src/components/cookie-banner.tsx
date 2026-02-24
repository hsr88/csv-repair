import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";

export function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            // slight delay so it doesn't flash on initial render
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    function accept() {
        localStorage.setItem("cookie-consent", "accepted");
        setVisible(false);
    }

    function decline() {
        localStorage.setItem("cookie-consent", "declined");
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-center pointer-events-none">
            <div
                className="pointer-events-auto w-full max-w-2xl rounded-xl border border-white/10 bg-[#1e1e2e]/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                role="dialog"
                aria-label="Cookie consent"
            >
                {/* icon */}
                <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-violet-400" />
                </div>

                {/* text */}
                <div className="flex-1 text-sm text-gray-300 leading-relaxed">
                    <span className="font-semibold text-white">We use cookies.</span>{" "}
                    This site uses Google Analytics to understand how visitors use it.
                    No personal data is stored or shared.{" "}
                    <a
                        href="/privacy"
                        className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
                    >
                        Privacy Policy
                    </a>
                </div>

                {/* buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={decline}
                        className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="px-4 py-1.5 text-xs rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-lg shadow-violet-900/30"
                    >
                        Accept
                    </button>
                    <button
                        onClick={decline}
                        aria-label="Close"
                        className="ml-1 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
