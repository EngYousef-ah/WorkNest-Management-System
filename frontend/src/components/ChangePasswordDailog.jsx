import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react";
import axios from "axios";
import Loading from "./Loading";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/Hooks/useCurrentUser";

const API = "http://localhost:3000";
export function ChangePasswordDialog({ open, setOpen }) {
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const [isLoading, setIsLoading] = useState(false);
    const loading = isLoading || isUserLoading;


    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
    }, [])


    const handlePasswordChange = async () => {

        setIsLoading(true);
        const userId = user?._id;
        try {
            const res = await axios.patch(`${API}/users/${userId}/change-password`,
                { oldPassword, newPassword, confirmPassword },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            toast.success(res?.data?.message);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "An error occurred, please try again.")
        }
        finally {
            setIsLoading(false);
            setOpen(false);
        }

    }



    return (
        <Dialog open={open} onOpenChange={setOpen} >

            <DialogContent className="bg-[oklch(0.4_0.03_270)]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">Change Password</DialogTitle>
                    <DialogDescription className="text-gray-300">
                        Enter your new password below.
                    </DialogDescription>
                </DialogHeader>
                {loading && <Loading />}
                <div className="grid gap-4 py-4 ">
                    <div className="grid gap-2">
                        <Label className="text-gray-400">Old Password</Label>
                        <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-gray-400">New Password</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-gray-400">Confirm Password</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>
                        Close
                    </Button>
                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={handlePasswordChange}
                        className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]"
                    >
                        {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}