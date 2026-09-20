'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="gate"><h1>Something didn’t load</h1><p>Your saved learning data is still in Google Sheets.</p><button onClick={reset}>Try again</button></main>;}
