import type {Metadata} from 'next';
import './globals.css';
export const metadata: Metadata={title:'Focus Shelf',description:'Explore freely. Start selectively. Finish deliberately.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;}
