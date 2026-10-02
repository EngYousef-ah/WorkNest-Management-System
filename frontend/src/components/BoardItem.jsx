import { useCurrentUser } from "@/Hooks/useCurrentUser";
import { useCurrentUserRoleInWorkspace } from "@/Hooks/useCurrentUserRoleInWorkspace";
import { Archive } from "lucide-react";

export default function BoardItem({ name, background, onArchive }) {
    const { data: user } = useCurrentUser();
    const { data: currentUserRoleInWorkspace } = useCurrentUserRoleInWorkspace(user?._id);


    return (
        <div className={`relative h-42 w-full cursor-pointer overflow-hidden rounded-xl p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
            style={{ backgroundColor: background }} >

            <div className="flex h-full flex-col justify-between">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="mt-1 text-xl font-bold">{name}</h1>
                    </div>
                    {currentUserRoleInWorkspace !== "Member" && (
                        <Archive onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onArchive(e);
                        }} />
                    )}


                </div>

                <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs"> Board </span>
                </div>
            </div>
        </div>
    );
}