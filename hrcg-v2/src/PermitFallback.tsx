// Simple sign-up used until the tear-off permit lands: two plain email actions.
export const CONTACT_EMAIL = 'hello@example.com';

const team = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('HRCG 2027 - Robot entry')}&body=${encodeURIComponent('Team:\nPlatform:\nWhich of the five tasks you are ready for:\nWhat you would need to take part:\n')}`;
const sponsor = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('HRCG 2027 - Sponsor or supplier')}&body=${encodeURIComponent('Company:\nWhat you could supply (products, equipment, funding, venue):\n')}`;

export function Permit() {
  return (
    <div className="pf">
      <a className="pf-card" href={team}>
        <span className="pf-k">Robot teams</span>
        <span className="pf-v">Enter your robot →</span>
      </a>
      <a className="pf-card" href={sponsor}>
        <span className="pf-k">Construction companies</span>
        <span className="pf-v">Sponsor or supply →</span>
      </a>
    </div>
  );
}
