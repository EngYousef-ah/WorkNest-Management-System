import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import axios from 'axios';
import BoardColumn from './BoardColumn';
import Loading from './Loading';
import AddListDailog from './AddListDailog';
import CardArchivedDailog from './CardArchivedDailog';
import socket from "@/socket"
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUserRoleInWorkspace } from '@/Hooks/useCurrentUserRoleInWorkspace';
import { useCurrentUser } from '@/Hooks/useCurrentUser';
const API = 'http://localhost:3000';
const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
};
export default function BoardCanvas() {
    const { slug, projectId, boardId } = useParams()
    const [openCardArchivedDailog, setOpenCardArchivedDailog] = useState(false)
    const [openNewList, setOpenNewList] = useState(false);
    const queryClient = useQueryClient();

    const { data: user } = useCurrentUser();
    const { data: currentUserRoleInWorkspace } = useCurrentUserRoleInWorkspace(user?._id);


    const { data: board, isFetching } = useQuery({
        queryKey: ['board', boardId],
        queryFn: async () => {

            const { data } = await axios.get(`${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/all-data`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            const listsWithCards = data?.lists.map((list) => ({
                ...list,
                cards: data?.cards?.filter((card) => card?.list_id === list?._id),
            }));

            return listsWithCards;
        },
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!boardId) return;


        const handleCardUpdated = (data) => {
            queryClient.setQueryData(['board', boardId], (oldBoard) => {
                if (!oldBoard) return oldBoard;

                return oldBoard.map((list) => ({
                    ...list,
                    cards: list.cards.map((card) =>
                        card._id === data.card._id ? data.card : card
                    ),
                }));
            });
        };

        socket.on("cardUpdated", handleCardUpdated);

        return () => {
            socket.emit("leaveBoard", boardId);
            socket.off("cardUpdated", handleCardUpdated);
        };

    }, [slug, projectId, boardId, queryClient]);

    const handleDragEnd = async (result) => {
        const { destination, source, type } = result;
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        if (!board) return;

        if (type === 'COLUMN') {
            const reorderedLists = Array.from(board);
            const [removedList] = reorderedLists.splice(source.index, 1);
            reorderedLists.splice(destination.index, 0, removedList);

            const updatedLists = reorderedLists.map((list, index) => ({
                ...list,
                position: index,
            }));

            queryClient.setQueryData(['board', boardId], updatedLists);

            try {
                await axios.put(
                    `${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/reorder`,
                    { lists: updatedLists.map((l) => ({ _id: l._id, position: l.position })) },
                    auth
                );
            } catch (err) {
                console.error('Failed to sync list order:', err);
                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }
            return;
        }

        const sourceListIndex = board.findIndex((l) => l._id === source.droppableId);
        const destListIndex = board.findIndex((l) => l._id === destination.droppableId);

        if (sourceListIndex === -1 || destListIndex === -1) return;

        const sourceList = board[sourceListIndex];
        const destList = board[destListIndex];

        let newBoardData = [...board];

        if (sourceList._id === destList._id) {
            const updatedCards = Array.from(sourceList.cards || []);
            const [movedCard] = updatedCards.splice(source.index, 1);
            updatedCards.splice(destination.index, 0, movedCard);

            const reindexedCards = updatedCards.map((card, idx) => ({ ...card, position: idx }));

            newBoardData[sourceListIndex] = { ...sourceList, cards: reindexedCards };

            queryClient.setQueryData(['board', boardId], newBoardData);

            try {
                await axios.put(
                    `${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/cards/move`,
                    { updatedCards: reindexedCards.map((c) => ({ _id: c._id, list_id: c.list_id, position: c.position })) },
                    auth
                );
            } catch (err) {
                console.error('Failed to sync card position:', err);
                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }
        } else {
            const sourceCards = Array.from(sourceList.cards || []);
            const destCards = Array.from(destList.cards || []);

            const [movedCard] = sourceCards.splice(source.index, 1);
            const updatedCard = { ...movedCard, list_id: destList._id };

            destCards.splice(destination.index, 0, updatedCard);

            const reindexedSource = sourceCards.map((c, idx) => ({ ...c, position: idx }));
            const reindexedDest = destCards.map((c, idx) => ({ ...c, position: idx }));

            newBoardData[sourceListIndex] = { ...sourceList, cards: reindexedSource };
            newBoardData[destListIndex] = { ...destList, cards: reindexedDest };
            queryClient.setQueryData(['board', boardId], newBoardData);

            const payloadCards = [
                ...reindexedSource.map((c) => ({ _id: c._id, list_id: c.list_id, position: c.position })),
                ...reindexedDest.map((c) => ({ _id: c._id, list_id: c.list_id, position: c.position })),
            ];

            try {
                await axios.put(
                    `${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/cards/move`,
                    { updatedCards: payloadCards },
                    auth
                );
            } catch (err) {
                console.error('Failed to move card across lists:', err);
                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }
        }
    };



    useEffect(() => {
        if (!boardId) return;


        const handleBoardUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        };

        socket.on("cardUpdated", handleBoardUpdate);
        socket.on("listsReordered", (data) => {
            if (!data || data.boardId === boardId) {
                handleBoardUpdate();
            }
        });
        socket.on("cardsMoved", handleBoardUpdate);

        return () => {
            socket.emit("leaveBoard", boardId);
            socket.off("cardUpdated", handleBoardUpdate);
            socket.off("listsReordered");
            socket.off("cardsMoved");
        };

    }, [slug, projectId, boardId, queryClient]);


    return (
        <div className="min-h-screen flex flex-col gap-6 p-6">
            <AddListDailog open={openNewList} setOpen={setOpenNewList} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['board', boardId] })} />
            <CardArchivedDailog open={openCardArchivedDailog} setOpen={setOpenCardArchivedDailog} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['board', boardId] })} />

            {currentUserRoleInWorkspace !== "Member" && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

                    <div className="group flex items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 transition hover:border-slate-600">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Organize your boards </h2>
                            <p className="mt-1 text-xs leading-5 text-slate-400"> Create lists and cards to organize your tasks. </p>
                        </div>

                        <button className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transitionhover:bg-blue-500" onClick={() => setOpenNewList(true)}>
                            + Add List
                        </button>
                    </div>

                    <div className="group flex items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 transition hover:border-slate-600">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Archived cards</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-400"> Browse and restore your archived cards.</p>
                        </div>

                        <button className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700" onClick={() => setOpenCardArchivedDailog(true)}>
                            Archive
                        </button>
                    </div>

                </div>
            )}





            {isFetching && <Loading />}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex items-start gap-4 overflow-x-auto pb-4 "
                        >
                            {board?.map((list, index) => (
                                <BoardColumn
                                    key={list._id}
                                    list={list}
                                    index={index}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}

                </Droppable>

            </DragDropContext>

        </div>
    );
}