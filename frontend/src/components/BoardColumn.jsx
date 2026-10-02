import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import BoardCard from './BoardCard';
import { Archive, Plus } from 'lucide-react';
import AddCardDailog from './AddCardDailog';
import { useParams } from 'react-router';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddListDailog from './AddListDailog';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/Hooks/useCurrentUser';
import { useCurrentUserRoleInWorkspace } from '@/Hooks/useCurrentUserRoleInWorkspace';
import Loading from './Loading';

const API = "http://localhost:3000"
export default function BoardColumn({ list, index }) {
  const [open, setOpen] = useState(false);
  const [openEditListName, setOpenEditListName] = useState(false);
  const [openEditCard, setOpenEditCard] = useState(false)
  const [currentCard, setCurrentCard] = useState([]);
  const { slug, projectId, boardId } = useParams();
  const [loadingArchiveCard, setLoadingArchiveCard] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: currentUserRoleInWorkspace } = useCurrentUserRoleInWorkspace(user?._id);
  const queryClient = useQueryClient();

  const handleArchiveListById = async (listId) => {

    try {
      const res = await axios.delete(`${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${listId}/archive`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success(res.data.message);
    }
    catch (err) {
      console.log(err);
    }


  }

  const handleArchiveCard = async (cardId) => {
    setLoadingArchiveCard(true)
    try {
      const res = await axios.delete(`${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${list._id}/cards/${cardId}/archive`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success(res.data.message);
    }
    catch (err) {
      console.log(err);
    }
    finally {
      setLoadingArchiveCard(false)
    }

  }
  return (
    <Draggable draggableId={list._id} index={index}>
      {(providedList) => (
        <div ref={providedList.innerRef} {...providedList.draggableProps} className="flex max-h-[calc(100vh-120px)] w-72 min-w-[280px] flex-col rounded-2xl bg-[#181a29]/80 border border-slate-800/80 p-3 shadow-xl backdrop-blur-md">
          <div {...providedList.dragHandleProps} className="mb-3 flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide hover:cursor-pointer" onClick={() => setOpenEditListName(true)}>{list.name}</h3>
            <span className="rounded-full bg-purple-950/60 border border-purple-800/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              {list.cards?.length || 0}
            </span>
            {currentUserRoleInWorkspace !== "Member" && (
              <Archive color='#fff' className='cursor-pointer' onClick={() => handleArchiveListById(list?._id)} />
            )}

          </div>

          <Droppable droppableId={list._id} type="CARD">
            {(providedCards, snapshot) => (
              <div
                ref={providedCards.innerRef}
                {...providedCards.droppableProps}
                className={`flex-1 overflow-y-auto px-1 py-0.5 transition-colors duration-200 rounded-xl custom-scrollbar ${snapshot.isDraggingOver ? 'bg-purple-950/20 border border-purple-500/20' : 'bg-transparent'
                  }`}
              >
                {list.cards?.map((card, cardIdx) => (
                  <BoardCard key={card._id} card={card} index={cardIdx}
                    handleEditCard={() => {
                      setOpenEditCard(true);
                      setCurrentCard(card);
                    }}
                    handleArchiveCard={() => {
                      handleArchiveCard(card._id)
                    }} />
                ))}
                {providedCards.placeholder}
              </div>
            )}
          </Droppable>

          <div className="mt-2 pt-1 border-t border-slate-800/50">
            {openEditCard && (
              <AddCardDailog open={openEditCard} setOpen={setOpenEditCard} list={list} card={currentCard} />
            )}
            <AddCardDailog open={open} setOpen={setOpen} list={list} />
            <AddListDailog open={openEditListName} setOpen={setOpenEditListName} list={list} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['board', boardId] })} />
            <div
              className="flex w-full items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-purple-600/10 hover:text-purple-300 transition-colors">
              <div className='flex  w-full items-center gap-1' onClick={() => {
                setOpen(true);

              }}>
                {loadingArchiveCard && <Loading />}

                <Plus size={24} />
                <p className="text-[15px] font-bold">Add Card</p>
              </div>

            </div>
          </div>

        </div>
      )}
    </Draggable>
  );
}