'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Modal } from '@/app/components/ui/Modal';
import { IconPicker } from '@/app/components/ui/IconPicker';
import { ColorPicker } from '@/app/components/ui/ColorPicker';
import {
  getListById,
  getItemsByListId,
  saveItem,
  deleteItem,
  saveCategory,
  getAllCategories,
  WishlistList,
  WishlistItem,
  WishlistCategory
} from '@/app/utils/db';
import { getNow } from '@/app/utils/date';
import * as LucideIcons from 'lucide-react';
import * as XLSX from 'xlsx';
import { Header } from '@/app/components/ui/Header';
import { PageTransition } from '@/app/components/ui/PageTransition';
import { motion } from 'framer-motion';

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

export default function WishlistDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [list, setList] = useState<WishlistList | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<WishlistCategory[]>([]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Item Form State
  const [itemEditingId, setItemEditingId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('bg-blue-500');
  const [catIcon, setCatIcon] = useState('Tag');

  const loadData = useCallback(async () => {
    const listData = await getListById(id);
    if (!listData) {
      router.push('/wishlist');
      return;
    }
    setList(listData);

    const [itemsData, catsData] = await Promise.all([
      getItemsByListId(id),
      getAllCategories()
    ]);

    setItems(itemsData);
    setCategories(catsData);
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let isMounted = true;
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
    return () => { isMounted = false; };
  }, [loadData]);

  const handleEditItem = (item: WishlistItem) => {
      setItemEditingId(item.id);
      setItemTitle(item.title);
      setItemUrl(item.url || '');
      setSelectedCategoryId(item.categoryId);
      setIsItemModalOpen(true);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle || !selectedCategoryId) return;

    const newItem: WishlistItem = {
      id: itemEditingId || crypto.randomUUID(),
      listId: id,
      title: itemTitle,
      url: itemUrl || undefined,
      categoryId: selectedCategoryId,
      createdAt: itemEditingId ? (items.find(i => i.id === itemEditingId)?.createdAt || getNow()) : getNow(),
    };

    await saveItem(newItem);
    await loadData();
    setIsItemModalOpen(false);
    resetItemForm();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const newCat: WishlistCategory = {
      id: crypto.randomUUID(),
      name: catName,
      color: catColor,
      iconName: catIcon,
      createdAt: getNow(),
    };

    await saveCategory(newCat);
    await loadData();
    setSelectedCategoryId(newCat.id); // Auto-select new category
    setIsCategoryModalOpen(false);
    setIsItemModalOpen(true); // Re-open item modal
    resetCategoryForm();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      await deleteItem(itemId);
      await loadData();
    }
  };

  const resetItemForm = () => {
    setItemEditingId(null);
    setItemTitle('');
    setItemUrl('');
    setSelectedCategoryId('');
  };

  const resetCategoryForm = () => {
    setCatName('');
    setCatColor('bg-blue-500');
    setCatIcon('Tag');
  };

  // Export Functions
  const exportToCSV = () => {
    if (!items.length) return;
    const headers = ['Title', 'URL', 'Category', 'Added Date'];
    const rows = items.map(item => {
        const cat = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
        return [item.title, item.url || '', cat, formatDate(item.createdAt)];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${list?.title}_wishlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${list?.title}_wishlist.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const exportToXLSX = () => {
    if (!items.length) return;
    const data = items.map(item => ({
        Title: item.title,
        URL: item.url || '',
        Category: categories.find(c => c.id === item.categoryId)?.name || 'Unknown',
        Date: formatDate(item.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wishlist");
    XLSX.writeFile(wb, `${list?.title}_wishlist.xlsx`);
  };

  const shareToWhatsapp = () => {
    if (!list) return;
    let text = `*${list.title}*\n${list.description || ''}\n\n`;

    items.forEach(item => {
        const cat = categories.find(c => c.id === item.categoryId)?.name || '';
        text += `• *${item.title}* (${cat})\n`;
        if (item.url) text += `  ${item.url}\n`;
        text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
        alert('List copied to clipboard! You can paste it in WhatsApp.');
    });
  };


  if (!list) return null;

  const isEmoji = !LucideIcons[list.iconName as keyof typeof LucideIcons];
  const Icon = !isEmoji ? LucideIcons[list.iconName as keyof typeof LucideIcons] : LucideIcons.Gift;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header title={list.title} backUrl="/wishlist" />

      <PageTransition className="px-6 md:px-8 pb-6 md:pb-8 pt-32 max-w-5xl mx-auto">

        {/* List Details Header */}
        <div className="relative rounded-3xl overflow-hidden mb-8 bg-neutral-900 border border-white/5">
           <div className={`absolute inset-0 opacity-20 ${list.color}`}></div>
           <div className="relative z-10 p-8 flex flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-black/30 backdrop-blur-md flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                 {list.thumbnailBlob ? (
                    <Image src={URL.createObjectURL(list.thumbnailBlob)} alt={list.title} width={96} height={96} className="object-cover w-full h-full" />
                 ) : (
                    isEmoji ? (
                        <span className="text-5xl">{list.iconName}</span>
                    ) : (
                        // @ts-expect-error - Dynamic Icon
                        React.createElement(Icon || LucideIcons.Gift, { size: 40 })
                    )
                 )}
              </div>
              <div className="flex-1">
                 <h1 className="text-3xl font-bold">{list.title}</h1>
                 <p className="text-neutral-400 mt-2">{list.description}</p>
                 <div className="flex gap-2 mt-4 text-xs font-mono text-neutral-500">
                    <span>{items.length} Items</span>
                    <span>•</span>
                    <span>Created {formatDate(list.createdAt)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Wishlist Items</h2>
            <button
               onClick={() => setIsItemModalOpen(true)}
               className="px-5 py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2"
            >
               <LucideIcons.Plus size={18} />
               Add Item
            </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 gap-4">
            {items.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <p>No items yet. Add something you desire!</p>
                </div>
            ) : (
                items.map((item, index) => {
                    const category = categories.find(c => c.id === item.categoryId);
                    // @ts-expect-error - Dynamic Icon
                    const CatIcon = category ? (LucideIcons[category.iconName] || LucideIcons.Tag) : LucideIcons.Tag;

                    return (
                        <motion.div
                           key={item.id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: index * 0.03 }}
                        >
                            <GlassCard className="flex items-center gap-4 group hover:bg-white/5 transition-colors">
                                {/* Store/Favicon Icon */}
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                                    {item.url ? (
                                        <img src={getFaviconUrl(item.url) || ''} alt="icon" className="w-8 h-8 object-contain opacity-80" onError={(e) => (e.currentTarget.src = '')} />
                                    ) : (
                                        <LucideIcons.Package size={20} className="text-neutral-500" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg truncate text-white/90">
                                            {item.url ? (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-white/30">
                                                    {item.title}
                                                </a>
                                            ) : (
                                                item.title
                                            )}
                                        </h3>
                                        {item.url && <LucideIcons.ExternalLink size={12} className="text-neutral-500" />}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {category && (
                                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/5 text-neutral-300 border border-white/5`}>
                                                <CatIcon size={12} className={category.color.replace('bg-', 'text-')} />
                                                {category.name}
                                            </div>
                                        )}
                                        <span className="text-xs text-neutral-500">Added {formatDate(item.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditItem(item)}
                                        className="p-2 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <LucideIcons.Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <LucideIcons.Trash2 size={18} />
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })
            )}
        </div>

        {/* Export & Share Actions (Bottom) */}
        <div className="mt-12 pt-8 flex justify-center">
            <div className="flex items-center bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 gap-1 shadow-2xl">
                <button
                    onClick={exportToCSV}
                    title="Export CSV"
                    className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <LucideIcons.FileSpreadsheet size={20} />
                </button>
                <button
                    onClick={exportToJSON}
                    title="Export JSON"
                    className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <LucideIcons.FileJson size={20} />
                </button>
                <button
                    onClick={exportToXLSX}
                    title="Export Excel"
                    className="p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <LucideIcons.Sheet size={20} />
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <button
                    onClick={shareToWhatsapp}
                    title="Share List"
                    className="p-3 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <LucideIcons.Share2 size={20} />
                </button>
            </div>
        </div>

        {/* Add/Edit Item Modal */}
        <Modal
            isOpen={isItemModalOpen}
            onClose={() => { setIsItemModalOpen(false); resetItemForm(); }}
            title={itemEditingId ? "Edit Item" : "Add New Item"}
        >
            <form onSubmit={handleSubmitItem} className="space-y-4">
                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Product URL (Optional)</label>
                    <div className="flex items-center gap-2 bg-neutral-800 rounded-lg border border-neutral-700 focus-within:ring-2 focus-within:ring-blue-500 px-3">
                        <LucideIcons.Link size={16} className="text-neutral-500" />
                        <input
                           type="url"
                           value={itemUrl}
                           onChange={(e) => setItemUrl(e.target.value)}
                           className="w-full bg-transparent py-3 text-white focus:outline-none"
                           placeholder="https://store.com/product..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Product Title</label>
                    <input
                       type="text"
                       required
                       value={itemTitle}
                       onChange={(e) => setItemTitle(e.target.value)}
                       className="w-full bg-neutral-800 rounded-lg border border-neutral-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="e.g., Wireless Headphones"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-neutral-400">Category</label>
                        <button
                           type="button"
                           onClick={() => { setIsItemModalOpen(false); setIsCategoryModalOpen(true); }}
                           className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            + New Category
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => {
                             // @ts-expect-error - Dynamic Icon
                            const Icon = LucideIcons[cat.iconName] || LucideIcons.Tag;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`p-3 rounded-lg border flex items-center gap-2 transition-all ${
                                        selectedCategoryId === cat.id
                                        ? `border-blue-500 bg-blue-500/10 text-white`
                                        : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                    }`}
                                >
                                    <Icon size={16} className={selectedCategoryId === cat.id ? 'text-blue-400' : ''} />
                                    <span className="truncate text-sm">{cat.name}</span>
                                </button>
                            );
                        })}
                        {categories.length === 0 && (
                            <p className="text-xs text-neutral-500 col-span-2 py-2">No categories yet. Create one!</p>
                        )}
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={!itemTitle || !selectedCategoryId}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {itemEditingId ? "Save Changes" : "Add Item"}
                </button>
            </form>
        </Modal>

        {/* Create Category Modal */}
        <Modal
            isOpen={isCategoryModalOpen}
            onClose={() => { setIsCategoryModalOpen(false); setIsItemModalOpen(true); }} // Go back to Item modal
            title="Create Category"
        >
            <form onSubmit={handleCreateCategory} className="space-y-6">
                <div>
                    <label className="text-sm text-neutral-400">Category Name</label>
                    <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Electronics, Clothes..."
                    />
                </div>

                <div className="space-y-2">
                   <label className="text-sm text-neutral-400">Color</label>
                   <ColorPicker selectedColor={catColor} onSelect={setCatColor} />
                </div>

                <div className="space-y-2">
                   <label className="text-sm text-neutral-400">Icon</label>
                   <IconPicker selectedIcon={catIcon} onSelect={setCatIcon} />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Save Category
                </button>
            </form>
        </Modal>

      </PageTransition>
    </div>
  );
}
