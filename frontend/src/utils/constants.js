export const TYPE_COLORS = {
  youtube:  '#FF4B4B',
  twitter:  '#1DA1F2',
  github:   '#6e40c9',
  paper:    '#F59E0B',
  blog:     '#10B981',
  article:  '#6366F1',
  pdf:      '#EF4444',
  pinterest:'#E60023',
  linkedin: '#0A66C2',
  concept:  '#A855F7',
  default:  '#8B5CF6',
}

export const TYPE_ICONS = {
  youtube:  '▶',
  twitter:  '✦',
  github:   '⬡',
  paper:    '◎',
  blog:     '✍',
  article:  '◈',
  pdf:      '📕',
  pinterest:'📌',
  linkedin: 'in',
  concept:  '◉',
  default:  '◉',
}

export function getColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default
}

export function getIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.default
}

export function exactDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', ''); // Output like "6:21pm"
}

export function isOldNode(dateStr, days = 30) {
  return (Date.now() - new Date(dateStr)) / 86400000 >= days
}
