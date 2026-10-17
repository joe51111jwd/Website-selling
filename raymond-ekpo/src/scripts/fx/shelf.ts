// The notes shelf: drag it sideways with a mouse (touch scrolls natively), use the arrows,
// and a bar shows how far along you are.
export function initShelf() {
  document.querySelectorAll<HTMLElement>('[data-shelf]').forEach((shelf) => {
    const track = shelf.querySelector<HTMLElement>('.shelf-track')!;
    const bar = shelf.querySelector<HTMLElement>('.shelf-progress')!;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const seen = max > 0 ? (track.scrollLeft + track.clientWidth) / track.scrollWidth : 1;
      bar.style.setProperty('--seen', String(seen));
    };
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();

    // links inside the track would otherwise start a native drag and cancel ours
    track.addEventListener('dragstart', (e) => e.preventDefault());

    let startX = 0;
    let startLeft = 0;
    let moved = 0;
    let down = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = 0;
      startX = e.clientX;
      startLeft = track.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) shelf.classList.add('dragging');
      track.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      // let the snap settle once the drag ends
      requestAnimationFrame(() => shelf.classList.remove('dragging'));
    });
    // a drag shouldn't open the card it ends on
    track.addEventListener(
      'click',
      (e) => {
        if (moved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    shelf.querySelectorAll<HTMLButtonElement>('.shelf-arrow').forEach((btn) =>
      btn.addEventListener('click', () => {
        const card = track.querySelector<HTMLElement>('.shelf-card');
        const step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
        track.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: 'smooth' });
      }),
    );
  });
}
