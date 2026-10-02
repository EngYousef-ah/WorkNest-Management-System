import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useWorkspaceMembers } from "@/Hooks/useWorkspaceMembers";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import toast from "react-hot-toast";

export default function WorkspaceLayout() {
    const navigate = useNavigate();

    const { data: workspaceMembers, isLoading: isMembersLoading } = useWorkspaceMembers();
    const { data: user, isLoading: isUserLoading } = useCurrentUser();

    useEffect(() => {
        if (isMembersLoading || isUserLoading) return;
        if (!workspaceMembers || !user) return;

        const isStillMember = workspaceMembers.some(
            (member) => member?.user_id?._id === user?._id
        );

        if (!isStillMember) {
            toast.error("You have been removed from this workspace.");
            navigate("/dashboard", { replace: true });
        }
    }, [workspaceMembers, user, isMembersLoading, isUserLoading, navigate]);

    return <Outlet />;
}