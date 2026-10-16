import { useState } from 'react';

import { reviewScreens, reviewViewports } from '../../data/reviewCatalog';

// Every frame is scaled to the same on-page height so the three widths compare side by side.
const FRAME_DISPLAY_HEIGHT = 340;

export function ReviewScreen() {
  const [activeId, setActiveId] = useState(reviewScreens[0]!.id);
  const active = reviewScreens.find((entry) => entry.id === activeId) ?? reviewScreens[0]!;
  const basePath = window.location.pathname.replace(/\/review\/?$/, '/') || '/';

  return (
    <main className="min-h-[100dvh] w-full bg-canvas px-5 pb-16 pt-8 text-ink md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="font-display text-[32px] font-black leading-10">Tinjauan responsif</h1>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Pilih layar">
          {reviewScreens.map((entry) => {
            const selected = entry.id === active.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveId(entry.id)}
                aria-pressed={selected}
                className={`min-h-14 rounded-chip border-[2.5px] border-ink px-4 font-body text-[16px] font-bold leading-5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${selected ? 'bg-accent shadow-sticker' : 'bg-card'}`}
              >
                {entry.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-10 space-y-12">
          {active.states.map((state) => (
            <section key={state.id} aria-labelledby={`review-${active.id}-${state.id}`}>
              <h2
                id={`review-${active.id}-${state.id}`}
                className="font-display text-[22px] font-extrabold leading-7"
              >
                {active.label} · {state.label}
              </h2>
              <div className="mt-4 flex flex-wrap items-start gap-6">
                {reviewViewports.map((viewport) => {
                  const scale = FRAME_DISPLAY_HEIGHT / viewport.height;
                  return (
                    <figure key={viewport.width} className="flex flex-col gap-2">
                      <div
                        className="overflow-hidden rounded-chip border-[2.5px] border-ink bg-paper shadow-sticker"
                        style={{
                          width: viewport.width * scale + 5,
                          height: FRAME_DISPLAY_HEIGHT + 5,
                        }}
                      >
                        <iframe
                          title={`${active.label}, ${state.label}, ${viewport.label}`}
                          src={`${basePath}?view=preview&screen=${active.id}&state=${state.id}`}
                          loading="lazy"
                          className="block origin-top-left border-0"
                          style={{
                            width: viewport.width,
                            height: viewport.height,
                            transform: `scale(${scale})`,
                          }}
                        />
                      </div>
                      <figcaption className="font-body text-[16px] leading-6 text-muted">
                        {viewport.label}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
