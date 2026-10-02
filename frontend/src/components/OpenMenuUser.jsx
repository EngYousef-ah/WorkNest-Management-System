import { LogOut, LogIn, User } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OpenMenuUser({ open, setOpen }) {
    const navigate = useNavigate();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>

            <DropdownMenuTrigger asChild>
                <button className="cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-md hover:bg-white/10 outline-none">
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56 bg-[oklch(30%_0.03_270)]">
                <Link to="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                        <User color="#6e66fa" />
                        <span className="text-white">Profile</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                    <LogIn color="#6e66fa" />
                    <span className="text-white">Signed in</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.dispatchEvent(new Event("local-storage-change"));
                        navigate("/")
                    }}
                >
                    <LogOut color="#f40b0b" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}