import { create } from 'zustand';

export const useBoardStore = create((set) => ({
    boardData: [],
    isLoading: false,

    setBoardData: (data) => set({ boardData: data }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    updateCardInState: (updatedCard) => set((state) => ({
        boardData: state.boardData.map((list) => {
            if (!list.cards) return list;
            return {
                ...list,
                cards: list.cards.map((card) =>
                    card._id === updatedCard._id ? updatedCard : card
                ),
            };
        }),
    })),

    addCardToState: (listId, newCard) => set((state) => ({
        boardData: state.boardData.map((list) => {
            if (list._id !== listId) return list;
            return {
                ...list,
                cards: [...(list.cards || []), newCard],
            };
        }),
    })),

    removeCardFromState: (listId, cardId) => set((state) => ({
        boardData: state.boardData.map((list) => {
            if (list._id !== listId) return list;
            return {
                ...list,
                cards: list.cards.filter((c) => c._id !== cardId),
            };
        }),
    })),
}));