export function EmptyUrls() {
  return (
    <div className="mx-auto max-w-md text-center">
      <svg
        className="mx-auto h-24 w-24 text-violet-500/60"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 44V22c0-2.2 1.8-4 4-4h16c2.2 0 4 1.8 4 4v22c0 2.2-1.8 4-4 4H24c-2.2 0-4-1.8-4-4Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M26 28h12M26 34h12M26 40h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-2 text-sm text-violet-700">
        No short URLs yet. Create one to start tracking clicks.
      </p>
    </div>
  )
}

