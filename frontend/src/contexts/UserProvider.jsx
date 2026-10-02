// import { useEffect, useState } from "react";
// import { UserContext } from "./UserContext";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";

// export function UserProvider({ children }) {
//     const [user, setUser] = useState(null);
//     const [loading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         const token = localStorage.getItem("token");

//         if (!token) {
//             setIsLoading(false);
//             return;
//         }

//         try {
//             const decoded = jwtDecode(token);
//             axios
//                 .get(`http://localhost:3000/users/${decoded.userId}`)
//                 .then((response) => {
//                     setUser(response.data);
//                 })
//                 .catch((error) => {
//                     console.log("There is an error fetching user data:", error);
//                     setError(error);
//                 })
//                 .finally(() => {
//                     setIsLoading(false);
//                 });

//         } catch (error) {
//             console.log("Invalid token");
//             setError(error);
//             setIsLoading(false);
//         }
//     }, []);

//     return (
//         <UserContext.Provider value={{ user, loading, error, }}>
//             {children}
//         </UserContext.Provider>
//     );
// }