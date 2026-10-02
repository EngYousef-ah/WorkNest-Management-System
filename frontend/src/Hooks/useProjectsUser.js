import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "react-router";

export const useProjectsUser = () => {

    const { slug } = useParams();

    const getProjectsUser = async () => {
        const res = await axios.get(`http://localhost:3000/workspaces/${slug}/projects`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        return res?.data?.projects;
    }

    return useQuery({
        queryKey: ["projectsUser", slug],
        queryFn: getProjectsUser,
        enabled: !!slug,
        staleTime: 5 * 60 * 1000
    });
}