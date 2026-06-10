import { Emoji, EmojiStyle } from 'emoji-picker-react';

export function toUnified(emojiStr: string) {
  return Array.from(emojiStr)
    .map(c => c.codePointAt(0)?.toString(16))
    .join('-');
}

export default function AppleEmoji({ emoji, size = 24, className }: { emoji: string, size?: number, className?: string }) {
  if (!emoji) return null;
  return (
    <span className={`inline-flex items-center justify-center align-middle drop-shadow-sm ${className || ''}`}>
      <Emoji unified={toUnified(emoji)} emojiStyle={EmojiStyle.APPLE} size={size} />
    </span>
  );
}
