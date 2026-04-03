// Type declarations for emoji-mart packages
declare module '@emoji-mart/react' {
  import React from 'react'
  interface EmojiPickerProps {
    data: unknown
    onEmojiSelect?: (emoji: { native: string; id: string; unified: string }) => void
    theme?: 'auto' | 'light' | 'dark'
    previewPosition?: 'none' | 'top' | 'bottom'
    searchPosition?: 'none' | 'sticky' | 'static'
    perLine?: number
    emojiSize?: number
  }
  const EmojiPicker: React.FC<EmojiPickerProps>
  export default EmojiPicker
}

declare module '@emoji-mart/data' {
  const data: unknown
  export default data
}
