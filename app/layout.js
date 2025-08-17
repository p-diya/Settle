import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';

const inter = Inter({
	subsets: ['latin'],
});

export const metadata = {
	title: 'Settle',
	description: 'Simplifying shared expenses',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className={`${inter.className} antialiased`}>
				<ClerkProvider>
					<ConvexClientProvider>
            <Header  />
						<main className="min-h-screen">{children}</main>
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
