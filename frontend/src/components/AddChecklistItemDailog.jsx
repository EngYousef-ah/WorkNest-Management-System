import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { useState } from "react"
import Loading from "./Loading"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API = "http://localhost:3000"

export default function AddChecklistItemDailog({ open, setOpen, card, currentChecklist, onRefreshItems }) {

    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false)




    const handleSubmit = async () => {
        if (!text) return;
        try {
            setIsLoading(true)
            await axios.post(`${API}/cards/${card?._id}/checklists/${currentChecklist?._id}/item`,
                { text },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            if (onRefreshItems) {
                await onRefreshItems(currentChecklist._id);
            }

            setText("")
            setIsLoading(false);
            setOpen(false);
        }
        catch (err) {
            setIsLoading(false)
            console.log(err?.response?.data?.message);
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[500px] overflow-y-auto sm:max-w-md bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <form >
                    {isLoading && <Loading />}

                    <DialogHeader >

                        <DialogTitle className="flex items-center gap-2 flex-wrap text-xl font-bold">
                            {card?.title && (
                                <span className="text font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                                    {card.title}
                                </span>
                            )}
                            <span className="bg-gradient-to-r from-[oklch(62%_0.21_277)] to-[oklch(72%_0.2_310)] bg-clip-text text-transparent">
                                {currentChecklist?.title}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="w-full mt-2 border-t border-slate-500"></div>

                    <FieldGroup className="mt-4 space-y-1">

                        <Field>
                            <Label htmlFor="title" className="text-slate-200 font-medium text-sm mb-1.5 block">
                                Text
                            </Label>
                            <Input id="title" name="title" required value={text} onChange={(e) => setText(e.target.value)}
                                placeholder="e.g. Checklist Item Text" className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
                        </Field>


                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">

                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            handleSubmit()
                        }} type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white font-semibold hover:opacity-90 transition-opacity">
                            Create Item
                        </Button>

                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
