import { create } from 'zustand'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: string
  file_url: string | null
  file_name: string | null
  file_size: number | null
  reply_to_id: string | null
  is_edited: boolean
  status: string
  created_at: string
  sender?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface Participant {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  unique_share_id: string | null
  status?: string | null
  last_seen?: string | null
}

export interface Conversation {
  id: string
  type: string
  name: string | null
  avatar_url: string | null
  created_by: string | null
  created_at: string
  archived_at: string | null
  pinned_at: string | null
  participants: Participant[]
  last_message: Message | null
  unread_count: number
}

interface TypingState {
  [convId: string]: string[] // user IDs typing
}

interface ChatState {
  conversations: Conversation[]
  activeConvId: string | null
  messages: { [convId: string]: Message[] }
  typing: TypingState
  hasMore: { [convId: string]: boolean }
  nextCursor: { [convId: string]: string | null }

  setConversations: (convs: Conversation[]) => void
  setActiveConv: (id: string | null) => void
  addMessage: (msg: Message) => void
  setMessages: (convId: string, msgs: Message[], hasMore: boolean, cursor: string | null) => void
  prependMessages: (convId: string, msgs: Message[], hasMore: boolean, cursor: string | null) => void
  updateMessageStatus: (msgId: string, status: string) => void
  setTyping: (convId: string, userId: string, isTyping: boolean) => void
  updateConversationLastMsg: (msg: Message) => void
  incrementUnread: (convId: string) => void
  clearUnread: (convId: string) => void
  updateUserStatus: (userId: string, status: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConvId: null,
  messages: {},
  typing: {},
  hasMore: {},
  nextCursor: {},

  setConversations: (convs) => set({ conversations: convs }),

  setActiveConv: (id) => {
    set({ activeConvId: id })
    if (id) get().clearUnread(id)
  },

  addMessage: (msg) => {
    set((state) => {
      const existing = state.messages[msg.conversation_id] || []
      if (existing.find((m) => m.id === msg.id)) return state
      return {
        messages: {
          ...state.messages,
          [msg.conversation_id]: [...existing, msg],
        },
      }
    })
    get().updateConversationLastMsg(msg)
  },

  setMessages: (convId, msgs, hasMore, cursor) =>
    set((state) => ({
      messages: { ...state.messages, [convId]: msgs },
      hasMore: { ...state.hasMore, [convId]: hasMore },
      nextCursor: { ...state.nextCursor, [convId]: cursor },
    })),

  prependMessages: (convId, msgs, hasMore, cursor) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...msgs, ...(state.messages[convId] || [])],
      },
      hasMore: { ...state.hasMore, [convId]: hasMore },
      nextCursor: { ...state.nextCursor, [convId]: cursor },
    })),

  updateMessageStatus: (msgId, status) =>
    set((state) => {
      const updated = { ...state.messages }
      for (const convId in updated) {
        updated[convId] = updated[convId].map((m) =>
          m.id === msgId ? { ...m, status } : m
        )
      }
      return { messages: updated }
    }),

  setTyping: (convId, userId, isTyping) =>
    set((state) => {
      const current = state.typing[convId] || []
      const next = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId)
      return { typing: { ...state.typing, [convId]: next } }
    }),

  updateConversationLastMsg: (msg) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === msg.conversation_id ? { ...c, last_message: msg } : c
      ),
    })),

  incrementUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId && c.id !== state.activeConvId
          ? { ...c, unread_count: (c.unread_count || 0) + 1 }
          : c
      ),
    })),

  clearUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      ),
    })),

  updateUserStatus: (userId, status) =>
    set((state) => ({
      conversations: state.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.id === userId ? { ...p, status } : p
        ),
      })),
    })),
}))
