import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useCurrentUserRoleInWorkspace = (userId) => {
    return useQuery({
        queryKey: ['userWorkspaceRole', userId],
        queryFn: async () => {

            const API = "http://localhost:3000"

            if (!API) return;
            const { data } = await axios.get(`${API}/workspaces/WorkspaceMember/${userId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            return data;
        },
        enabled: !!userId,
        select: (data) => data?.[0]?.role ?? null,
        refetchOnWindowFocus: false

    });
};