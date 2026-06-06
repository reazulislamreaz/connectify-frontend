interface MessageTicksProps {
  delivered?: boolean;
  read?: boolean;
  className?: string;
}

/**
 * WhatsApp-style delivery/seen indicator for the sender's own messages:
 *  - not delivered yet (sent) → single faint tick
 *  - delivered               → single tick
 *  - read / seen             → double tick, colored
 */
export function MessageTicks({ delivered, read, className }: MessageTicksProps) {
  const colorClass = read
    ? "text-sky-500"
    : delivered
      ? "text-current"
      : "text-current opacity-50";

  if (read || delivered) {
    // Double tick once read; the read state is distinguished by color.
    const single = delivered && !read;
    return single ? (
      <SingleTick className={`${colorClass} ${className ?? ""}`} />
    ) : (
      <DoubleTick className={`${colorClass} ${className ?? ""}`} />
    );
  }

  // Sent but not yet delivered.
  return <SingleTick className={`${colorClass} ${className ?? ""}`} />;
}

function SingleTick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 11"
      className={`inline-block h-3 w-4 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 6.2 L6 9.3 L13.6 1.4" />
    </svg>
  );
}

function DoubleTick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 11"
      className={`inline-block h-3 w-[1.15rem] ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 6.2 L4.3 9.3 L11 1.4" />
      <path d="M6.6 9.0 L7.2 9.6 L14.2 1.4" />
    </svg>
  );
}
