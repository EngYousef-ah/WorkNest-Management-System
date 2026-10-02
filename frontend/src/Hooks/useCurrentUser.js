import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const useCurrentUser = () => {


    const getCurrentUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        const decoded = jwtDecode(token);
        const res = await axios.get(`http://localhost:3000/users/${decoded.userId}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        return res.data;
    }

    return useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        staleTime: 5 * 60 * 1000
    });
};

