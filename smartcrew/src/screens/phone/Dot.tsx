import { PhoneShell, PhoneHeader, PhoneButton, CircleButton } from "../kit";

// STUB: replace with the full screen.
export default function Dot() {
  return (
    <PhoneShell
      tab={null}
      footer={
        <>
          <PhoneButton>Cancel</PhoneButton>
          <PhoneButton tone="dark">Submit</PhoneButton>
        </>
      }
    >
      <PhoneHeader icon="clipboard" title="DOT Inspection Report" right={<CircleButton icon="history" />} />
    </PhoneShell>
  );
}
