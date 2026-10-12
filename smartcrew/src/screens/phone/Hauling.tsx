import { PhoneShell, PhoneHeader, PhoneButton, CircleButton } from "../kit";

// STUB: replace with the full screen.
export default function Hauling() {
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
      <PhoneHeader icon="truck" title="Hauling Log" right={<CircleButton icon="history" />} />
    </PhoneShell>
  );
}
