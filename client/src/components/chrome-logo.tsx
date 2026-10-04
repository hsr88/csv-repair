export function ChromeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M50 0a50 50 0 0 1 43.3 25H50a25 25 0 0 0-21.65 37.5L6.7 25A50 50 0 0 1 50 0Z" />
      <path fill="#34A853" d="m6.7 25 21.65 37.5a25 25 0 0 0 43.3 0L50 100A50 50 0 0 1 6.7 25Z" />
      <path fill="#FBBC05" d="M93.3 25A50 50 0 0 1 50 100l21.65-37.5A25 25 0 0 0 50 25Z" />
      <circle cx="50" cy="50" r="23" fill="#4285F4" stroke="#FFF" strokeWidth="4" />
    </svg>
  );
}
