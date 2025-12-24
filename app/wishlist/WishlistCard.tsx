'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard } from '@/app/components/ui/GlassCard';
import * as LucideIcons from 'lucide-react';
import { WishlistList } from '@/app/utils/db';
import { useObjectUrl } from '@/app/hooks/useObjectUrl';

interface WishlistCardProps {
  list: WishlistList;
  onEdit: (e: React.MouseEvent, list: WishlistList) => void;
  onDuplicate: (e: React.MouseEvent, list: WishlistList) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({
  list,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  // @ts-expect-error - Dynamic icon lookup
  const Icon = LucideIcons[list.iconName];
  const isEmoji = !Icon;

  const thumbUrl = useObjectUrl(list.thumbnailBlob);

  return (
    <Link href={`/wishlist/${list.id}`} className="block group">
      <GlassCard className="h-full relative overflow-hidden flex flex-col gap-4 border border-white/5 hover:border-white/10 transition-colors">
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => onEdit(e, list)}
            className="p-2 bg-black/50 hover:bg-orange-600/80 rounded-full backdrop-blur-sm text-white transition-colors md:opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <LucideIcons.Edit2 size={16} />
          </button>
          <button
            onClick={(e) => onDuplicate(e, list)}
            className="p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm text-white transition-colors md:opacity-0 group-hover:opacity-100"
            title="Duplicate"
          >
            <LucideIcons.Copy size={16} />
          </button>
          <button
            onClick={(e) => onDelete(e, list.id)}
            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full backdrop-blur-sm text-white transition-colors md:opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <LucideIcons.Trash2 size={16} />
          </button>
        </div>

        {/* Header / Thumbnail */}
        <div className={`h-32 w-full rounded-xl flex items-center justify-center relative overflow-hidden ${list.color} bg-opacity-20`}>
          <div className={`absolute inset-0 ${list.color} opacity-20`}></div>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={list.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            isEmoji ? (
              <span className="text-5xl scale-100 group-hover:scale-110 transition-transform duration-300">{list.iconName}</span>
            ) : (
              <Icon size={48} className="text-white/50 group-hover:text-white/70 transition-colors" />
            )
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-xl font-bold truncate group-hover:text-orange-200 transition-colors">{list.title}</h3>
          <p className="text-neutral-400 text-sm line-clamp-2 mt-1">
            {list.description || 'No description'}
          </p>
        </div>

        <div className="mt-auto text-xs text-neutral-500 flex items-center gap-1">
          <LucideIcons.Clock size={12} />
          {new Date(list.createdAt).toLocaleDateString()}
        </div>
      </GlassCard>
    </Link>
  );
};
