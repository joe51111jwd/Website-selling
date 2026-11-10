import { LoginForm } from "@/components/Forms";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="login">
      <div className="login__card">
        <p className="brand"><b>TMWRK</b><span>Roster Intelligence</span></p>
        <h1>Never miss<br />a moment.</h1>
        <LoginForm next={next} />
        {!process.env.DASHBOARD_PASSWORD && !(process.env.SOUNDCHARTS_APP_ID && process.env.SOUNDCHARTS_API_KEY) && (
          <p className="muted">Demo with simulated data: the password is <code>demo</code>.</p>
        )}
      </div>
    </main>
  );
}
