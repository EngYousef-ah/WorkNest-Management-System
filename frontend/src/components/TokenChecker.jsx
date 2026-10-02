import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

export default function TokenChecker() {
    const navigate = useNavigate();

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const requestUrl = error.config?.url || "";
                
                const isAuthRoute = requestUrl.includes("/login") || requestUrl.includes("/register");

                if (!isAuthRoute && error.response && error.response.status === 401) {
                    localStorage.removeItem("token");
                    toast.error("Your session has expired, Please log in again.");
                    navigate("/login", { replace: true });
                }
                
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);

    return null;
}