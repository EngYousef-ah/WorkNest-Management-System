import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import { useParams } from "react-router"
import axios from "axios"
import CardArchiveItem from "./CardArchiveItem"
import toast from "react-hot-toast"

import { useQueryClient } from '@tanstack/react-query'; 

export default function CardArchivedDailog({ open, setOpen }) {
    const { slug, projectId, boardId } = useParams();
    const [cardsArchive, setCardsArchive] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient();
    useEffect(() => {
        if (open) {
            refreshData();
        }
    }, [open, slug, projectId, boardId])

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards/${boardId}/cardsArchive`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            setCardsArchive(res.data);
        } catch (err) {
            toast.error("Failed to load archived cards");
            console.log(err?.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    };


    const handleRestoreCard = async (cardId, listId) => {
        setIsLoading(true);
        try {
            const res = await axios.patch(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${listId}/cards/${cardId}/restore`, {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            )
            setCardsArchive((prev) => prev.filter(card => card.id !== cardId));
            await queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            toast.success(res.data.message);
            setOpen(false)
            setIsLoading(false);
        }
        catch (err) {
            toast.error(err.response?.data?.message)
        } finally {
            setIsLoading(false)
        }

    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[700px] overflow-y-auto sm:max-w-3xl bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <form >
                    {isLoading && <Loading />}

                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            Restore Archived Cards
                        </DialogTitle>
                    </DialogHeader>

                    <FieldGroup className="mt-4 space-y-1">
                        {cardsArchive?.length === 0 && (
                            <div className="flex justify-center items-center text-[16px] text-slate-500 p-2 mt-3">
                                There are no archived cards.
                            </div>
                        )}
                        {cardsArchive?.map((card) => {
                            const listId = card?.list_id?._id;
                            const cardId = card?._id
                            return <CardArchiveItem card={card} handleRestoreCard={() => handleRestoreCard(cardId, listId)} />
                        })}
                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Cancel
                        </Button>

                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
