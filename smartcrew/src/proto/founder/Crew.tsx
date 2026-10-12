import { ScreenCrop } from "./Screen";
import { Ph } from "./ui";

const STEPS = [
  { id: "phone-home", label: "Clock in", alt: "Crew app home screen with the Clock In button" },
  { id: "phone-select-task", label: "Select your task", alt: "Crew app task picker: project, activity code and machine" },
  { id: "phone-working", label: "Clock out", alt: "Crew app while clocked in, with the Clock Out button" },
];

export function Crew() {
  return (
    <section className="f-crew" aria-labelledby="f-crew-h" data-sec="crew">
      <div className="f-wrap f-crew-grid">
        <div className="f-crew-phones" role="list" aria-label="Clock in, select your task, clock out">
          {STEPS.map((s, i) => (
            <figure className="f-crew-step" role="listitem" key={s.id}>
              <figcaption className="f-crew-cap">
                {i > 0 && <span className="f-crew-arrow" aria-hidden="true" />}
                {s.label}
              </figcaption>
              <ScreenCrop id={s.id} w={402} h={874} className="f-phone" label={s.alt} />
            </figure>
          ))}
        </div>

        <div className="f-crew-copy">
          <h2 id="f-crew-h" className="f-h2">
            No training. Your crew taps Clock In, picks the task and goes to work.
          </h2>
          <ul className="f-facts" data-pair-end>
            <li>Designed for simplicity. No training needed. Just open the app and go.</li>
            <li>It runs in the background without draining batteries or being shut down by accident.</li>
            <li>No data is shared, so your crew doesn’t have to worry about privacy.</li>
            <li>Most crews are up and running within minutes.</li>
            <li className="f-facts-ph">
              <Ph inline label="Placeholder for Andrew to confirm">
                GPS only runs while they’re on the clock.
              </Ph>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
