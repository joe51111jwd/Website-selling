import type { AnchorHTMLAttributes, MouseEvent, Ref } from "react";
import { go, type ExpandFrom } from "../lib/transition";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  ref?: Ref<HTMLAnchorElement>;
  to: string;
  /** Called on click to get the picture to fly into the next page. */
  expand?: (anchor: HTMLAnchorElement) => ExpandFrom | undefined;
};

/** An in-site link that runs a page transition instead of a full load. */
export function Link({ to, expand, onClick, children, ...rest }: Props) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to, { from: expand?.(e.currentTarget) });
  };
  return (
    <a href={to} onClick={click} {...rest}>
      {children}
    </a>
  );
}
