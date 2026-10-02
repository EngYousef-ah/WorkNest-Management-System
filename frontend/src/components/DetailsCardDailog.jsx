import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { ChevronLeft, ChevronRight, Loader2, SquareCheckBig, Trash, Upload } from "lucide-react"
import axios from "axios"
import AttachmentItem from "./AttachmentItem"
import toast from "react-hot-toast"
import AddChecklistDailog from "./AddChecklistDailog"
import AddChecklistItemDailog from "./AddChecklistItemDailog"
import ActivityLogItem from "./ActivityLogItem"
import CardWatcherItem from "./CardWatcherItem"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router"
const API = "http://localhost:3000";




export default function DetailsCardDailog({ open, setOpen, card, onUploadSuccess }) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("checklists");
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [members, setMembers] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [itemsByChecklist, setItemsByChecklist] = useState({});
    const [openAddChecklistDailog, setOpenAddChecklistDailog] = useState(false);
    const [openAddChecklistItemDailog, setOpenAddChecklistItemDailog] = useState(false);
    const [currentChecklist, setCurrentChecklist] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const { boardId } = useParams();
    const queryClient = useQueryClient();
    const cardId = card?._id;
    const [page, setPage] = useState(1);


    const fetchWatchers = async (cardId) => {
        const res = await axios.get(`${API}/cards/${cardId}/watchers`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        return res.data;
    };

    const fetchActivityLogs = async (cardId, page) => {
        const res = await axios.get(`${API}/cards/${cardId}/activities`, {
            params: { page },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        return res.data;
    }

    const toggleWatch = async (cardId) => {
        const res = await axios.post(`${API}/cards/${cardId}/watch`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return res.data;
    };


    const getAllMembersInCard = async () => {
        if (!card?._id) return;
        try {
            const res = await axios.get(`${API}/cards/${card?._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setMembers(res.data.cardAssignments)
        } catch (err) {
            console.log(err?.response?.data?.message);
        }
    };

    const getChecklistItems = async (checklistId) => {

        if (!checklistId || !card?._id) return;
        try {
            const res = await axios.get(`${API}/cards/${card?._id}/checklists/${checklistId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            const rawData = res.data;
            const itemsArray = Array.isArray(rawData)
                ? rawData
                : (rawData?.items || rawData?.checklistItems || []);

            setItemsByChecklist((prev) => ({
                ...prev,
                [checklistId]: itemsArray
            }));
        } catch (err) {
            console.log("Error fetching items:", err?.response?.data?.message);
        }
    };


    const getAllChecklistsInCard = async () => {
        if (!card?._id) return;
        try {
            setIsLoading(true);
            const res = await axios.get(`${API}/cards/${card?._id}/checklists`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            const fetchedChecklists = Array.isArray(res.data) ? res.data : (res.data?.checklists || []);
            setChecklists(fetchedChecklists);

            fetchedChecklists.forEach((chk) => {
                const chkId = chk._id || chk.id;
                if (chkId) {
                    getChecklistItems(chkId);
                }
            });
        } catch (err) {
            console.log("Error fetching checklists:", err?.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getAllAttachmentsForCard = async () => {
        setIsLoading(true)
        try {
            const res = await axios.get(`${API}/cards/${card?._id}/attachments`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            setAttachments(res.data.attachments);
            setIsLoading(false)

        }
        catch (err) {
            console.log(err.response.data.message);
            setIsLoading(false)
        }
    }
    useEffect(() => {
        if (!open || !card?._id) return;
        getAllMembersInCard();
        getAllChecklistsInCard();
        getAllAttachmentsForCard()
        setPage(1);
    }, [card, open]);

    const handleDeleteAttachmentItem = async (attachmentId) => {
        setIsLoading(true);
        try {
            const res = await axios.delete(`${API}/cards/${card?._id}/attachments/${attachmentId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await getAllAttachmentsForCard();
            toast.success(res.data.message);
            setIsLoading(false);
        }
        catch (err) {
            console.log(err.response.data.message);
            setIsLoading(false);
        }
    };

    const handleAddFiles = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };


    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });

        try {
            setIsUploading(true);

            const response = await axios.post(`${API}/cards/${card?._id}/attachments`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            await getAllAttachmentsForCard();
            toast.success('The file was uploaded successfully ');
            setIsLoading(false)
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }

        } catch (error) {
            toast.error("There is an error in the file format.");
            console.log(error);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleDeleteItem = async (checklistId, itemId) => {
        setIsLoading(true)
        if (!checklistId || !itemId || !card?._id) {
            toast.error("There was an error. Please try again.لا");
            return
        }
        try {
            await axios.delete(`${API}/cards/${card?._id}/checklists/${checklistId}/items/${itemId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            setItemsByChecklist((prev) => ({
                ...prev,
                [checklistId]: prev[checklistId]?.filter((item) => item._id !== itemId)
            }));

            setIsLoading(false)

        }
        catch (err) {
            console.log(err);
            setIsLoading(false)

        }
    }

    const handleChangeStatueItem = async (checklistId, itemId) => {
        setIsLoading(true)
        if (!checklistId || !itemId || !card?._id) {
            toast.error("There was an error. Please try again.لا");
            return
        }

        setItemsByChecklist((prev) => ({
            ...prev,
            [checklistId]: prev[checklistId]?.map((item) =>
                item._id === itemId ? { ...item, is_completed: !item.is_completed } : item
            )
        }));
        try {
            await axios.patch(`${API}/cards/${card?._id}/checklists/${checklistId}/items/${itemId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            getChecklistItems(checklistId);
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            setIsLoading(false)
            toast.success("Updated successfully");
        }
        catch (err) {
            console.log(err.message);
            setIsLoading(false);
            setItemsByChecklist((prev) => ({
                ...prev,
                [checklistId]: prev[checklistId]?.map((item) =>
                    item._id === itemId ? { ...item, is_completed: !item.is_completed } : item
                )
            }));

        }
    }


    const handleAddMemberToChecklist = async (checklistId, itemId, memberId) => {

        setIsLoading(true);
        try {
            await axios.patch(`${API}/cards/${card?._id}/checklists/${checklistId}/items/${itemId}/addMember`,
                { memberId },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await getChecklistItems(checklistId);
            toast.success("Updated successfully");
            setIsLoading(false)
        }
        catch (err) {
            console.log(err?.response?.data?.message);
            setIsLoading(false)
        }
    }

    const handleUpdateItemDate = async (checklistId, itemId, newDate) => {
        if (!checklistId || !itemId || !card?._id) return;
        setIsLoading(true)

        try {
            await axios.patch(`${API}/cards/${card?._id}/checklists/${checklistId}/items/${itemId}/changeDueDate`,
                { due_date: newDate },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            await getChecklistItems(checklistId);
            toast.success("Date updated successfully");
            setIsLoading(false)

        } catch (err) {
            console.log(err?.response?.data?.message || err.message);
            toast.error("Failed to update date");
            getChecklistItems(checklistId);
            setIsLoading(false)

        }
    };




    const { data: watchers = [], isLoading: isLoadingWatchers } = useQuery({
        queryKey: ["watchers", cardId],
        queryFn: () => fetchWatchers(cardId),
        enabled: !!cardId,
        refetchOnWindowFocus: false
    });

    const { data: activityData, isLoading: isLoadingActivity, isFetching: isFetchingActivity } = useQuery({
        queryKey: ["activityLogs", cardId, page],
        queryFn: () => fetchActivityLogs(cardId, page),
        enabled: !!cardId && currentTab === "activityLogs"
    });

    const activityLogs = activityData?.activities || [];

    const totalPages = activityData?.pagination?.totalPages || 1;

    const watchMutation = useMutation({
        mutationFn: () => toggleWatch(cardId),
        onSuccess: (data) => {
            toast.success(data?.message);
            queryClient.invalidateQueries({ queryKey: ["watchers", cardId] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message);
        },
    });






    const token = localStorage.getItem("token")
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const userId = decodedPayload.userId;

    const isWatching = watchers?.some(watcher => watcher.user_id._id === userId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[700px] overflow-y-auto sm:max-w-3xl bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <div>
                    {isLoading && <Loading />}

                    <AddChecklistDailog open={openAddChecklistDailog} setOpen={setOpenAddChecklistDailog} card={card} onRefreshData={getAllChecklistsInCard} />

                    <AddChecklistItemDailog open={openAddChecklistItemDailog} setOpen={setOpenAddChecklistItemDailog} card={card} currentChecklist={currentChecklist} onRefreshItems={() => {
                        getChecklistItems(currentChecklist._id);
                    }} />


                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            {card?.title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className=" grid grid-cols-2 sm:flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 mt-3">
                        <button
                            type="button"
                            onClick={async () => {
                                setCurrentTab("checklists")
                                await getAllChecklistsInCard()
                            }}
                            className={`flex-1 py-2 px-4 text-sm font-medium text-white ${currentTab === "checklists" ? "bg-slate-700" : ""} rounded-md shadow-sm hover:bg-slate-600 transition-colors`}
                        >
                            Checklist Items
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                setCurrentTab("fileAttachments")
                                await getAllAttachmentsForCard()
                            }}
                            className={`flex-1 py-2 px-4 text-sm font-medium text-white ${currentTab === "fileAttachments" ? "bg-slate-700" : ""} rounded-md shadow-sm hover:bg-slate-600 transition-colors`}
                        >
                            File Attachments
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                setCurrentTab("activityLogs")
                                setPage(1);

                            }}
                            className={`flex-1 py-2 px-4 text-sm font-medium text-white ${currentTab === "activityLogs" ? "bg-slate-700" : ""} rounded-md shadow-sm hover:bg-slate-600 transition-colors`}
                        >
                            Activity Logs
                        </button>

                        <button
                            type="button"
                            onClick={() => { setCurrentTab("watchers") }}
                            className={`flex-1 py-2 px-4 text-sm font-medium text-white ${currentTab === "watchers" ? "bg-slate-700" : ""} rounded-md shadow-sm hover:bg-slate-600 transition-colors`}
                        >
                            Watchers
                        </button>
                    </div>

                    <div className="w-full mt-2 border-t border-slate-500"></div>

                    <FieldGroup className="mt-4 space-y-1">
                        {currentTab === "checklists" && (
                            <div className="text-slate-400">
                                <button type="button" onClick={() => setOpenAddChecklistDailog(true)} className="text-slate-300 mb-5 text-[16px] px-10 py-2 bg-slate-600 rounded-sm hover:bg-slate-700 transition-all duration-100">
                                    Add Checklist
                                </button>

                                {checklists.map((checklist) => {
                                    const chkId = checklist._id;

                                    const items = itemsByChecklist[chkId] || [];

                                    return (
                                        <div key={chkId} className="mb-6 p-4 bg-slate-800/40 rounded-lg border border-slate-700/60">
                                            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-3">
                                                <h1 className="text-[17px] font-medium flex items-center gap-2 text-white">
                                                    <SquareCheckBig size={20} className="text-indigo-400" />
                                                    {checklist?.title}
                                                </h1>


                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentChecklist(checklist);
                                                            setOpenAddChecklistItemDailog(true);
                                                        }}
                                                        className="p-1.5 px-3 bg-slate-600 text-slate-200 text-xs rounded hover:bg-slate-500 transition-colors"
                                                    >
                                                        Add Item
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {items && items.length > 0 ? (
                                                    items.map((item) => {
                                                        const itemId = item._id;
                                                        return (
                                                            <div key={itemId} className="ml-2 p-2.5 bg-slate-900/60 rounded flex items-center justify-between gap-2 border border-slate-700/50">
                                                                <div className="flex gap-2 items-center">
                                                                    <input
                                                                        id={`item-${itemId}`}
                                                                        type="checkbox"
                                                                        checked={Boolean(item.is_completed)}
                                                                        onChange={() => handleChangeStatueItem(chkId, itemId)}
                                                                        className="w-4 h-4 cursor-pointer accent-indigo-500"
                                                                    />
                                                                    <label htmlFor={`item-${itemId}`} className="text-sm text-slate-200 cursor-pointer">
                                                                        {item?.text}
                                                                    </label>
                                                                </div>

                                                                <div className="flex gap-3 items-center">
                                                                    <input
                                                                        type="date"
                                                                        className="px-6 py-2 rounded bg-slate-800 border-2 border-slate-700 text-slate-300 text-xs"
                                                                        value={item?.due_date ? new Date(item.due_date).toISOString().split("T")[0] : ""}
                                                                        onChange={(e) => handleUpdateItemDate(chkId, itemId, e.target.value)}
                                                                    />
                                                                    <select className="px-6 py-2 rounded bg-slate-800 border-2  border-slate-700" value={item.assigned_to} onChange={(e) => handleAddMemberToChecklist(chkId, itemId, e.target.value)}>
                                                                        {members.length > 0 && members.map((member) => {
                                                                            const memberId = member?.user_id?._id;
                                                                            const memberName = member?.user_id?.display_name;
                                                                            return (
                                                                                <option key={memberId} value={memberId} className="bg-slate-800 text-slate-300">{memberName}</option>
                                                                            )
                                                                        })}
                                                                    </select>
                                                                    <Trash color="#e30202" size={18} className="cursor-pointer hover:opacity-80"
                                                                        onClick={() => handleDeleteItem(chkId, itemId)}
                                                                    /></div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-slate-500 italic pl-2">There are no added items in this list.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {currentTab === "fileAttachments" && (
                            <div className="flex flex-col gap-6">
                                <h1 className="text-2xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">Attachments</h1>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            multiple
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx,.zip"
                                        />

                                        <button
                                            type="button"
                                            onClick={handleAddFiles}
                                            disabled={isUploading}
                                            className=" inline-flex items-center px-3 py-2 rounded-md gap-2 bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {isUploading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <Upload size={20} />
                                            )}
                                            <span className="text-[16px]">
                                                {isUploading ? 'Uploading.....' : 'Add Attachment'}
                                            </span>
                                        </button>
                                    </div>
                                    <h1 className="text-slate-400 text-xs">
                                        max 5MB, supported formats: JPG, PNG, WEBP, PDF, DOCX
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    {attachments.map((attachment) => {
                                        const dateAndTime = new Date(attachment?.created_at);
                                        return (
                                            <AttachmentItem
                                                key={attachment?._id}
                                                title={attachment?.fileName}
                                                uploder={attachment?.uploaderId?.display_name}
                                                date={dateAndTime.toLocaleString('en-EG')}
                                                handleDeleteAttachmentItem={() => handleDeleteAttachmentItem(attachment?._id)}
                                            />
                                        )

                                    })}

                                </div>
                            </div>
                        )}

                        {currentTab === "activityLogs" && (
                            <div className="flex flex-col gap-3">
                                {activityLogs?.map((activityLog) => {

                                    return <ActivityLogItem key={activityLog._id} activityLog={activityLog} />
                                })}
                                {isLoadingActivity && <Loading />}
                                {!isLoadingActivity &&
                                    <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-700/60">

                                        <button
                                            type="button"
                                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                            disabled={page === 1 || isLoadingActivity}
                                            className="
            flex items-center justify-center
            w-9 h-9
            rounded-md
            border border-slate-700
            bg-slate-800
            text-slate-300
            transition-all duration-200
            hover:bg-slate-700
            hover:text-white
            hover:border-slate-600
            disabled:opacity-30
            disabled:cursor-not-allowed
        "
                                        >
                                            <ChevronLeft size={18} />
                                        </button>


                                        <div className="
        flex items-center gap-2
        px-4 py-2
        rounded-md
        bg-slate-800/80
        border border-slate-700
    ">
                                            <span className="text-sm font-medium text-white">
                                                {page}
                                            </span>

                                            <span className="text-sm text-slate-500">
                                                /
                                            </span>

                                            <span className="text-sm text-slate-400">
                                                {totalPages}
                                            </span>
                                        </div>


                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPage(prev => prev + 1);
                                            }}
                                            disabled={page >= totalPages || isFetchingActivity}
                                            className="
        flex items-center justify-center
        w-9 h-9
        rounded-md
        border border-slate-700
        bg-slate-800
        text-slate-300
        transition-all duration-200
        hover:bg-slate-700
        hover:text-white
        hover:border-slate-600
        disabled:opacity-30
        disabled:cursor-not-allowed
    "
                                        >
                                            <ChevronRight size={18} />
                                        </button>

                                    </div>
                                }

                            </div>
                        )}

                        {currentTab === "watchers" && (
                            <div className="flex flex-col gap-4 ">
                                {watchers?.map((item) => (
                                    <CardWatcherItem key={item?._id} name={item?.user_id?.full_name} email={item?.user_id?.email} />
                                ))}
                            </div>
                        )}
                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        {currentTab === "watchers" && (
                            <Button type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white font-semibold hover:opacity-90 transition-opacity"
                                onClick={() => watchMutation.mutate()} disabled={watchMutation.isPending}>
                                {watchMutation.isPending ? "Updating..." : isWatching ? "UnWatch" : "Watch"}
                            </Button>
                        )}

                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog >
    );
}