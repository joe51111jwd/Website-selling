"use client";

/** the email preview, sized to its content so nothing (like the button) is cut off */
export function EmailFrame({ title, html }: { title: string; html: string }) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin"
      onLoad={(e) => {
        const f = e.currentTarget;
        const h = f.contentDocument?.documentElement.scrollHeight;
        if (h) f.style.height = `${h + 2}px`;
      }}
    />
  );
}
