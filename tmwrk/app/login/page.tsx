import { LoginForm } from "@/components/Forms";
import { Mark } from "@/components/Icon";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const demo = !process.env.DASHBOARD_PASSWORD && !(process.env.SOUNDCHARTS_APP_ID && process.env.SOUNDCHARTS_API_KEY);
  return (
    <main className="login">
      <div className="login__card">
        <p className="logo"><Mark /><b>TMWRK</b></p>
        <h1>Sign in</h1>
        <p>Daily Spotify and TikTok alerts for the catalog.</p>
        <LoginForm next={next} />
        {demo && <p className="login__hint">This is the demo. The password is <code>demo</code>.</p>}
      </div>
    </main>
  );
}
