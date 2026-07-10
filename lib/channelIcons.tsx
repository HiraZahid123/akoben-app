import { Mail, MessageSquare, MessageCircle, Phone, Handshake, Bookmark, type LucideIcon } from 'lucide-react'

export const CHANNEL_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  phone_call: Phone,
  in_person: Handshake,
  other: Bookmark,
}

export function ChannelIcon({ channel, size = 16, className }: { channel: string; size?: number; className?: string }) {
  const Icon = CHANNEL_ICONS[channel] ?? Bookmark
  return <Icon size={size} className={className} />
}
