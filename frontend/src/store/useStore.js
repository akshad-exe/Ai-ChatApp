import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),

  // Chat state
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),

  // UI state
  isOnline: true,
  setIsOnline: (status) => set({ isOnline: status }),
}));

export default useStore; 