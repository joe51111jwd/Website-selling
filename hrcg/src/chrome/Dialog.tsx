// Native modal <dialog> wrapper bound to the overlays store: showModal() traps focus, Esc closes,
// focus returns to the trigger, Lenis is stopped (data-lenis-prevent). Owner: A1.

import { useEffect, useRef, type ReactNode } from 'react';
import { overlays, useOverlay, type OverlayId } from './overlays';

export interface DialogProps {
  id: OverlayId;
  className?: string;
  labelledBy?: string;
  label?: string;
  children: ReactNode;
}

export function Dialog({ id, className, labelledBy, label, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useOverlay() === id;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => {
      if (overlays.get() === id) overlays.close();
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      overlays.close();
    };
    d.addEventListener('close', onClose);
    d.addEventListener('cancel', onCancel);
    return () => {
      d.removeEventListener('close', onClose);
      d.removeEventListener('cancel', onCancel);
    };
  }, [id]);

  return (
    <dialog
      ref={ref}
      className={`hrcg-dialog ${className ?? ''}`}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      data-lenis-prevent=""
      onClick={(e) => {
        // a click on the backdrop (the dialog box itself, outside the inner panel) closes
        if (e.target === ref.current) overlays.close();
      }}
    >
      {children}
    </dialog>
  );
}

export default Dialog;
