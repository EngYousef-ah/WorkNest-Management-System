export default function Loading() {
    return (
        <div className="fixed h-full-screen inset-0 flex justify-center items-center bg-black/30 z-50">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-purple-700  rounded-full animate-spin"></div>
        </div>
    );
}