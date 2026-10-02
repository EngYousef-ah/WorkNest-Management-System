import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import toast from "react-hot-toast"
import axios from "axios"
import { useParams } from "react-router"


export default function AddListDailog({ open, setOpen, onRefresh, list }) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const { slug, projectId, boardId } = useParams();
    
    useEffect(() => {
        if (list) {
            setName(list.name);
        } else {
            setName("");
        }
    }, [list, open]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (!list) {
                const res = await axios.post(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists`,
                    {
                        name: name
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                )
                onRefresh(true)
                setOpen(false)
                setName("")
                toast.success(res.data.message);
                setIsLoading(false);
            }
            else {
                const res = await axios.patch(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${list._id}`,
                    {
                        name
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                )
                if (onRefresh) onRefresh();
                toast.success(res.data.message);
                setIsLoading(false);
                setOpen(false)
                setName("")
            }



        }
        catch (err) {
            toast.error(err.response?.data?.message);
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-sm bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <form onSubmit={handleSubmit}>
                    {isLoading && <Loading />}

                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            {list ? "Edit List" : "Create a List"}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldGroup className="mt-5 space-y-4">
                        <Field>
                            <Label htmlFor="name" className="text-slate-200 font-medium text-sm mb-1.5 block">
                                List name
                            </Label>
                            <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. To Do" className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
                        </Field>

                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Cancel
                        </Button>

                        <Button type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white font-semibold hover:opacity-90 transition-opacity">
                            {/* {isLoading ? "Loading" : "Create List"} */}
                            {isLoading ? "Loading..." : list ? "Update List" : "Create List"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}