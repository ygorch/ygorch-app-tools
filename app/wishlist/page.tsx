'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Modal } from '@/app/components/ui/Modal';
import { IconPicker } from '@/app/components/ui/IconPicker';
import { ColorPicker } from '@/app/components/ui/ColorPicker';
import { getAllLists, saveList, deleteList, WishlistList } from '@/app/utils/db';
import * as LucideIcons from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function WishlistHome() {
  const [lists, setLists] = useState<WishlistList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  const [iconName, setIconName] = useState('Gift');
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setIsLoading(true);
      const data = await getAllLists();
      setLists(data);
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setColor('bg-blue-500');
    setIconName('Gift');
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 256,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setThumbnail(compressedFile);
      setThumbnailPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newList: WishlistList = {
      id: crypto.randomUUID(),
      title,
      description,
      color,
      iconName,
      thumbnailBlob: thumbnail || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveList(newList);
    await loadLists();
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this list?')) {
      await deleteList(id);
      await loadLists();
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, list: WishlistList) => {
    e.stopPropagation();
    const duplicatedList: WishlistList = {
      ...list,
      id: crypto.randomUUID(),
      title: `${list.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveList(duplicatedList);
    await loadLists();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              My Wishlists
            </h1>
            <p className="text-neutral-400 mt-2">Organize your dreams and desires.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <LucideIcons.Plus size={20} />
            New List
          </button>
        </header>

        {isLoading ? (
          <div className="text-center text-neutral-500 py-20">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="text-center text-neutral-500 py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
            <LucideIcons.PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No wishlists found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => {
              // @ts-expect-error - Dynamic icon lookup
              const Icon = LucideIcons[list.iconName] || LucideIcons.Gift;
              const thumbUrl = list.thumbnailBlob ? URL.createObjectURL(list.thumbnailBlob) : null;

              return (
                <Link href={`/wishlist/${list.id}`} key={list.id} className="block group">
                  <GlassCard className="h-full relative overflow-hidden flex flex-col gap-4">
                     {/* Actions */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => handleDuplicate(e, list)}
                        className="p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm text-white transition-colors"
                        title="Duplicate"
                      >
                        <LucideIcons.Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, list.id)}
                        className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full backdrop-blur-sm text-white transition-colors"
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
                           className="object-cover"
                         />
                      ) : (
                        <Icon size={48} className="text-white/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-xl font-bold truncate">{list.title}</h3>
                      <p className="text-neutral-400 text-sm line-clamp-2 mt-1">
                        {list.description || 'No description'}
                      </p>
                    </div>

                    <div className="mt-auto text-xs text-neutral-500">
                      Created: {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}

        {/* Create List Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title="Create New Wishlist"
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Thumbnail Upload */}
            <div className="flex flex-col items-center gap-4">
               <div className={`w-32 h-32 rounded-2xl border-2 border-dashed border-neutral-600 flex items-center justify-center overflow-hidden relative ${color} bg-opacity-10`}>
                  {thumbnailPreview ? (
                    <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="text-center p-2">
                       {/* @ts-expect-error - Dynamic Icon */}
                       {React.createElement(LucideIcons[iconName] || LucideIcons.Gift, { size: 32, className: "mx-auto mb-2 opacity-50" })}
                       <span className="text-xs text-neutral-400">Preview</span>
                    </div>
                  )}
               </div>
               <label className="cursor-pointer px-4 py-2 bg-neutral-800 rounded-lg text-sm hover:bg-neutral-700 transition-colors">
                  Upload Cover Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
               </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">List Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tech Upgrade 2024"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                placeholder="What's this list for?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Theme Color</label>
              <ColorPicker selectedColor={color} onSelect={setColor} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Icon</label>
              <IconPicker selectedIcon={iconName} onSelect={setIconName} />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
            >
              Create List
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
