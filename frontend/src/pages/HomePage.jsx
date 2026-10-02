import CardInfoHome from '@/components/CardInfoHome'
import { Kanban } from 'lucide-react'
import { Link } from 'react-router'
export default function HomePage() {
    return (
        <div className="min-h-screen bg-[oklch(14%_0.03_270)] text-white">

            <div className="sticky top-0 z-40 border-b border-white/10 bg-[oklch(14%_0.03_270)]/80 backdrop-blur-md">
                <div className="container mx-auto p-4">

                    <header className="flex flex-col sm:flex-row items-center justify-between gap-3">

                        <div className="flex items-center gap-3 font-semibold tracking-wide">
                            <div className="w-8 h-8 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] flex justify-center items-center" >
                                <Kanban />
                            </div>
                            <div>WORKNEST</div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                            <Link to="login">
                                <button className="px-4 py-1.5 text-sm sm:text-base rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] hover:opacity-90 transition">
                                    Sign in
                                </button>
                            </Link>
                            <Link to="register">
                                <button className="px-4 py-1.5 text-sm sm:text-base rounded-md border border-white/15 hover:bg-white/10 transition">
                                    Get Started
                                </button>
                            </Link>
                        </div>

                    </header>

                </div>
            </div>

            <div className="container mx-auto flex flex-col items-center text-center gap-7 pt-20 md:pt-40 px-4">

                <h1 className="text-4xl md:text-5xl lg:text-7xl font-semibold leading-tight">
                    Move work forward,<br />
                    <span className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                        together.
                    </span>
                </h1>

                <p className="max-w-xl text-center text-gray-400 text-lg sm:text-2xl">
                    WorkNest brings workspaces, projects, and kanban boards together so your team can plan, track, and ship without friction.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">

                    <Link to="register">
                        <button className="px-5 py-2 rounded-md flex items-center gap-2 bg-white/10 hover:bg-white/15 transition">
                            Start free <span>→</span>
                        </button>
                    </Link>

                    <Link to="login">
                        <button className="px-5 py-2 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] hover:opacity-90 transition">
                            Sign in
                        </button>
                    </Link>

                </div>

            </div>

            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-20">

                <CardInfoHome icon={"Kanban"} title={"Kanban that flows"} description={"Drag-and-drop cards across lists. Customizable boards per project."} />
                <CardInfoHome icon={"UsersRound"} title={"Built for teams"} description={"Multi-tenant workspaces with roles and shared project libraries."} />
                <CardInfoHome icon={"Zap"} title={"Real-time ready"} description={"Live updates so everyone sees the same board state instantly."} />

            </div>

            <footer className="flex justify-center items-center  text-gray-400 border-t border-gray-700 h-[100px] mt-10">
                © 2026 WorkNest. Built with care.
            </footer>

        </div>
    )
}