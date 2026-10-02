import { BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export default function CardWorkspace({  workspace }) {
    
    return (
        <Link to={`/workspaces/${workspace.slug}`}>
            <div
                key={workspace._id}
                className="group flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:bg-gray-750 hover:shadow-lg cursor-pointer"
            >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/20">
                    <BriefcaseBusiness
                        size={30}
                        className="text-sky-400 transition-colors group-hover:text-sky-300"
                    />
                </div>

                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">
                        {workspace.name}
                    </h2>

                    {/* <p className="mt-1 text-sm text-gray-400">
                        3 Projects
                    </p> */}
                </div>
            </div>
        </Link>

    );
}