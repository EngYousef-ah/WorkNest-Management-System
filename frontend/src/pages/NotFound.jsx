import { Link } from "react-router-dom";
export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(20%_0.03_270)] to-[oklch(14%_0.03_270)] px-6">

            <h1 className="text-8xl  mb-4 tracking-widest bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text font-semibold">404</h1>
            <h2 className="text-2xl md:text-3xl  mb-4 bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text font-semibold">
                Page Not Found
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Sorry, the page you are looking for doesn’t exist or has been moved.
            </p>
            <Link to="/" className="inline-block bg-white text-gray-800 font-semibold px-6 py-3 rounded-2xl
            shadow-lg hover:scale-105 transition-transform duration-300">
                Go Back Home
            </Link>
        </div>
    );
}