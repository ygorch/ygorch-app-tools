'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { IconPicker } from '@/app/components/ui/IconPicker';
import { ColorPicker } from '@/app/components/ui/ColorPicker';
import {
  getAllLists,
  saveList,
  deleteList,
  WishlistList,
  saveItem,
  saveCategory,
  getAllCategories,
  WishlistCategory,
  WishlistItem
} from '@/app/utils/db';
import { Header } from '@/app/components/ui/Header';
import { PageTransition } from '@/app/components/ui/PageTransition';
import * as LucideIcons from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { usePreferences } from '@/app/hooks/usePreferences';
import { getTextColor } from '@/app/utils/styles';
import { WishlistCard } from './WishlistCard';
import Image from 'next/image';

export default function WishlistHome() {
  const { preferences } = usePreferences();
  const textColor = preferences ? getTextColor(preferences.backgroundColor) : 'text-white';
  const isDark = textColor === 'text-white';

  const [lists, setLists] = useState<WishlistList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Theme styles for form inputs
  const inputStyles = isDark
    ? "bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:ring-orange-500"
    : "bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-500 focus:ring-orange-500";

  const labelStyles = isDark ? "text-neutral-400" : "text-neutral-600";

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-orange-500');
  const [iconName, setIconName] = useState('Gift');
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  // Fix: Cleanup thumbnail preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

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
    setEditingId(null);
    setTitle('');
    setDescription('');
    setColor('bg-orange-500');
    setIconName('Gift');
    setThumbnail(null);
    // Note: The useEffect will cleanup the previous URL when thumbnailPreview changes
    setThumbnailPreview(null);
  };

  const handleEditList = (e: React.MouseEvent, list: WishlistList) => {
    e.preventDefault();
    e.stopPropagation();

    setEditingId(list.id);
    setTitle(list.title);
    setDescription(list.description);
    setColor(list.color);
    setIconName(list.iconName);
    setThumbnail(list.thumbnailBlob || null);
    if (list.thumbnailBlob) {
        // The previous URL is revoked by the useEffect before this new one is set (if it triggers a render)
        // or we rely on the state update lifecycle.
        setThumbnailPreview(URL.createObjectURL(list.thumbnailBlob));
    } else {
        setThumbnailPreview(null);
    }

    setIsModalOpen(true);
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
      id: editingId || crypto.randomUUID(),
      title,
      description,
      color,
      iconName,
      thumbnailBlob: thumbnail || undefined,
      createdAt: editingId ? (lists.find(l => l.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };

    await saveList(newList);
    await loadLists();
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this list?')) {
      await deleteList(id);
      await loadLists();
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, list: WishlistList) => {
    e.stopPropagation();
    e.preventDefault();
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const text = await file.text();
          const json = JSON.parse(text);

          // Support new format with list metadata
          if (!json.list || !json.items) {
             alert('Invalid file format. This importer expects a full list export (JSON with list metadata).');
             return;
          }

          setIsLoading(true);

          const listData = json.list;
          const itemsData = json.items;
          const catsData: WishlistCategory[] = json.categories || [];

          // 1. Process Thumbnail
          let thumbnailBlob: Blob | undefined = undefined;
          if (listData.thumbnailBase64) {
              try {
                  const res = await fetch(listData.thumbnailBase64);
                  thumbnailBlob = await res.blob();
              } catch (err) {
                  console.error("Failed to process thumbnail", err);
              }
          }

          // 2. Create List
          const newListId = crypto.randomUUID();
          const newList: WishlistList = {
              id: newListId,
              title: listData.title,
              description: listData.description,
              color: listData.color,
              iconName: listData.iconName,
              thumbnailBlob: thumbnailBlob,
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          await saveList(newList);

          // 3. Process Categories
          const existingCats = await getAllCategories();
          const catIdMap = new Map<string, string>(); // Old ID -> New ID

          for (const cat of catsData) {
              // Check if category with same name exists
              const existing = existingCats.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
              if (existing) {
                  catIdMap.set(cat.id, existing.id);
              } else {
                  // Create new category
                  const newCatId = crypto.randomUUID();
                  const newCat: WishlistCategory = {
                      id: newCatId,
                      name: cat.name,
                      color: cat.color,
                      iconName: cat.iconName,
                      createdAt: Date.now()
                  };
                  await saveCategory(newCat);
                  catIdMap.set(cat.id, newCatId);
                  existingCats.push(newCat); // Update local list
              }
          }

          // 4. Process Items
          for (const item of itemsData) {
              let catId = item.categoryId;
              if (catId && catIdMap.has(catId)) {
                  catId = catIdMap.get(catId)!;
              }

              const newItem: WishlistItem = {
                  id: crypto.randomUUID(),
                  listId: newListId,
                  title: item.title,
                  url: item.url,
                  categoryId: catId || '',
                  createdAt: item.createdAt || Date.now()
              };
              await saveItem(newItem);
          }

          await loadLists();
          alert('List imported successfully!');

      } catch (error) {
          console.error("Import failed", error);
          alert("Failed to import list.");
      } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  return (
    <div className={`min-h-screen ${textColor}`}>
      <Header title="My Wishlists" />

      <PageTransition className="px-8 pb-8 pt-24 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
             <h1 className={`text-3xl font-bold ${textColor}`}>
               Collections
             </h1>
             <p className={`text-sm mt-1 ${textColor} opacity-70`}>Manage your organized lists</p>
          </div>
          <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="px-5 py-2.5 bg-neutral-800 text-neutral-300 font-semibold rounded-full hover:bg-neutral-700 hover:text-white transition-colors flex items-center gap-2"
                title="Import"
              >
                <LucideIcons.Upload size={18} />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-lg hover:scale-105 transform duration-200"
                title="Create New List"
              >
                <LucideIcons.Plus size={18} />
              </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-neutral-500 py-20">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="text-center text-neutral-500 py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
            <LucideIcons.PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No wishlists found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <WishlistCard
                  list={list}
                  onEdit={handleEditList}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit List Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title={editingId ? "Edit Wishlist" : "Create New Wishlist"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Thumbnail Upload */}
            <div className="flex flex-col items-center gap-4">
               <div className={`w-32 h-32 rounded-2xl border-2 border-dashed ${isDark ? 'border-neutral-600' : 'border-neutral-300'} flex items-center justify-center overflow-hidden relative ${color} bg-opacity-10`}>
                  {thumbnailPreview ? (
                    <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="text-center p-2 flex flex-col items-center justify-center">
                       {(() => {
                            // @ts-expect-error - Dynamic Icon
                           const Icon = LucideIcons[iconName];
                           if (Icon) {
                               return <Icon size={32} className="mx-auto mb-2 opacity-50" />;
                           } else {
                               return <span className="text-4xl mb-2">{iconName}</span>;
                           }
                       })()}
                       <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Preview</span>
                    </div>
                  )}
               </div>
               <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900'}`}>
                  {thumbnail ? "Change Cover Image" : "Upload Cover Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
               </label>
               {thumbnail && (
                 <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="text-xs text-red-400 hover:text-red-300">
                    Remove Image
                 </button>
               )}
            </div>

            <div className="space-y-2">
              <label className={`text-sm ${labelStyles}`}>List Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-lg p-3 border focus:outline-none focus:ring-2 ${inputStyles}`}
                placeholder="e.g., Tech Upgrade 2024"
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm ${labelStyles}`}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full rounded-lg p-3 border focus:outline-none focus:ring-2 h-24 resize-none ${inputStyles}`}
                placeholder="What's this list for?"
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm ${labelStyles}`}>Theme Color</label>
              <ColorPicker selectedColor={color} onSelect={setColor} />
            </div>

            <div className="space-y-2">
              <label className={`text-sm ${labelStyles}`}>Icon / Emoji</label>
              <IconPicker selectedIcon={iconName} onSelect={setIconName} />
            </div>

            <button
              type="submit"
              className={`w-full py-3 font-bold rounded-xl transition-colors ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-900 text-white hover:bg-neutral-700'}`}
            >
              {editingId ? "Save Changes" : "Create List"}
            </button>
          </form>
        </Modal>
      </PageTransition>
    </div>
  );
}
