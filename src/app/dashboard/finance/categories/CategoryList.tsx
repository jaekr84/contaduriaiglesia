'use client'

import { deleteCategory, bulkDeleteCategories, updateCategory, createCategory, reorderCategories } from '../actions'
import { Trash2, Loader2, ChevronRight, ChevronDown, Edit2, Check, X, Plus, CornerDownRight, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Category, TransactionType } from '@prisma/client'

type CategoryWithChildren = Category & { subcategories?: Category[] }

export function CategoryList({ categories }: { categories: CategoryWithChildren[] }) {
    const router = useRouter()
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isBulkDeleting, startBulkDelete] = useTransition()
    const [isReordering, startReorder] = useTransition()

    // Internal state for immediate UI update during reordering
    const [localCategories, setLocalCategories] = useState(categories)

    // Sync local state when props change
    useEffect(() => {
        setLocalCategories(categories)
    }, [categories])

    const rootCategories = localCategories.filter(c => !c.parentId)

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const handleBulkDelete = () => {
        if (!confirm(`¿Eliminar ${selectedIds.size} categorías?`)) return
        startBulkDelete(async () => {
            const result = await bulkDeleteCategories(Array.from(selectedIds))
            if (result?.error) toast.error(result.error)
            else {
                toast.success('Categorías eliminadas')
                setSelectedIds(new Set())
                setIsEditMode(false)
                router.refresh()
            }
        })
    }

    const moveCategory = (id: string, direction: 'up' | 'down', parentId: string | null = null) => {
        const listToSort = localCategories.filter(c => c.parentId === parentId)
        const index = listToSort.findIndex(c => c.id === id)
        if (index === -1) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= listToSort.length) return

        const newList = [...listToSort]
        const [moved] = newList.splice(index, 1)
        newList.splice(newIndex, 0, moved)

        const orderedIds = newList.map(c => c.id)

        startReorder(async () => {
            const result = await reorderCategories(orderedIds)
            if (result?.error) toast.error(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between p-2 border-b border-zinc-100 dark:border-zinc-800 px-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Lista</span>
                <div className="flex gap-2">
                    {isEditMode && selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="text-xs flex items-center gap-1 text-red-600 font-medium hover:underline"
                        >
                            {isBulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Borrar ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`text-xs flex items-center gap-1 font-medium transition-colors ${isEditMode ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                            }`}
                    >
                        {isEditMode ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                        {isEditMode ? 'Listo' : 'Editar'}
                    </button>
                </div>
            </div>

            {rootCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                    Sin categorías.
                </div>
            ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {rootCategories.map((cat, index) => (
                        <CategoryItem
                            key={cat.id}
                            category={cat}
                            hasChildren={(cat.subcategories?.length || 0) > 0}
                            isEditMode={isEditMode}
                            isSelected={selectedIds.has(cat.id)}
                            onToggle={() => toggleSelect(cat.id)}
                            selectedIds={selectedIds}
                            onToggleId={toggleSelect}
                            onMove={(dir) => moveCategory(cat.id, dir, null)}
                            isFirst={index === 0}
                            isLast={index === rootCategories.length - 1}
                            isReordering={isReordering}
                        />
                    ))}
                </ul>
            )}
        </div>
    )
}

function CategoryItem({
    category,
    hasChildren,
    isEditMode,
    isSelected,
    onToggle,
    selectedIds,
    onToggleId,
    onMove,
    isFirst,
    isLast,
    isReordering
}: {
    category: CategoryWithChildren,
    hasChildren: boolean,
    isEditMode: boolean,
    isSelected: boolean,
    onToggle: () => void,
    selectedIds: Set<string>,
    onToggleId: (id: string) => void,
    onMove: (direction: 'up' | 'down') => void,
    isFirst: boolean,
    isLast: boolean,
    isReordering: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isAddingSub, setIsAddingSub] = useState(false)
    const children = category.subcategories || []

    const toggleExpand = () => setIsExpanded(!isExpanded)
    const router = useRouter()

    const moveSub = async (id: string, direction: 'up' | 'down') => {
        // Sort children by current order to ensure consistency
        const listToSort = [...children].sort((a, b) => (a as any).order - (b as any).order)
        const index = listToSort.findIndex(c => c.id === id)
        if (index === -1) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= listToSort.length) return

        const newList = [...listToSort]
        const [moved] = newList.splice(index, 1)
        newList.splice(newIndex, 0, moved)

        const result = await reorderCategories(newList.map(c => c.id))
        if (result?.error) toast.error(result.error)
        else router.refresh()
    }

    return (
        <li className="flex flex-col group">
            <div className={`flex items-center justify-between p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors`}>
                <div className="flex items-center gap-2 flex-1 relative">
                    {/* Checkbox (Edit Mode) */}
                    {isEditMode && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggle}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                        />
                    )}

                    {/* Expand/Collapse Chevron */}
                    <button
                        onClick={toggleExpand}
                        className={`p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${children.length === 0 ? 'invisible' : ''}`}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {/* Name */}
                    <EditableName category={category} isEditMode={isEditMode} />
                </div>

                {/* Actions (Add Subcategory & Reorder) */}
                <div className="flex items-center gap-1">
                    {!isEditMode && (
                        <>
                            <div className="flex items-center group-hover:opacity-100 opacity-0 transition-opacity">
                                <button
                                    onClick={() => onMove('up')}
                                    disabled={isFirst || isReordering}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                                    title="Mover arriba"
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => onMove('down')}
                                    disabled={isLast || isReordering}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                                    title="Mover abajo"
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                <button
                                    onClick={() => {
                                        setIsExpanded(true)
                                        setIsAddingSub(true)
                                    }}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                    title="Agregar Subcategoría"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Render Children (Expanded) */}
            {(isExpanded || isAddingSub) && (
                <ul className="bg-zinc-50/30 dark:bg-zinc-900/10 border-l-2 border-zinc-100 dark:border-zinc-800 ml-5 pl-1">
                    {/* Existing Children */}
                    {children.map((child, index) => (
                        <div key={child.id} className="flex items-center justify-between p-2 pl-3 text-sm hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-r-md group/sub">
                            <div className="flex items-center gap-2 flex-1 text-zinc-600 dark:text-zinc-400">
                                {isEditMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(child.id)}
                                        onChange={() => onToggleId(child.id)}
                                        className="h-3 w-3 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                )}
                                <CornerDownRight className="h-3 w-3 opacity-40" />
                                <EditableName category={child} isEditMode={isEditMode} />
                            </div>
                            {!isEditMode && (
                                <div className="flex items-center opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => moveSub(child.id, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => moveSub(child.id, 'down')}
                                        disabled={index === children.length - 1}
                                        className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                                    >
                                        <ArrowDown className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Inline Add Form */}
                    {isAddingSub && (
                        <div className="p-2 pl-3">
                            <AddSubcategoryForm
                                parentId={category.id}
                                type={category.type}
                                onCancel={() => setIsAddingSub(false)}
                            />
                        </div>
                    )}
                </ul>
            )}
        </li>
    )
}

function AddSubcategoryForm({ parentId, type, onCancel }: { parentId: string, type: TransactionType, onCancel: () => void }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const name = inputRef.current?.value.trim()
        if (!name) return

        const formData = new FormData()
        formData.append('name', name)
        formData.append('type', type)
        formData.append('parentId', parentId)

        startTransition(async () => {
            const result = await createCategory(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Subcategoría agregada')
                router.refresh()
                onCancel()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CornerDownRight className="h-3 w-3 text-zinc-400 ml-1" />
            <input
                ref={inputRef}
                autoFocus
                placeholder="Nombres (ej: sub1, sub2)..."
                className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-700"
            />
            <div className="flex gap-1">
                <button
                    type="submit"
                    disabled={isPending}
                    className="p-1 rounded bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 rounded bg-zinc-200 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        </form>
    )
}

function EditableName({ category, isEditMode }: { category: Category, isEditMode: boolean }) {
    const [name, setName] = useState(category.name)
    const [isSaving, startSaving] = useTransition()
    const router = useRouter()

    const handleBlur = () => {
        if (name === category.name) return
        startSaving(async () => {
            const formData = new FormData()
            formData.set('name', name)
            const result = await updateCategory(category.id, formData)
            if (result?.error) {
                toast.error(result.error)
                setName(category.name)
            } else {
                toast.success('Actualizado')
                router.refresh()
            }
        })
    }

    if (isEditMode) {
        return (
            <div className="relative flex-1 max-w-[200px]">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur()
                        }
                    }}
                    disabled={isSaving}
                    className="w-full bg-white border border-zinc-200 rounded px-1 text-zinc-900 focus:outline-none focus:border-zinc-400 text-sm h-6 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
                />
                {isSaving && <Loader2 className="absolute right-1 top-1 h-3 w-3 animate-spin text-zinc-400" />}
            </div>
        )
    }

    return <span className="text-zinc-900 dark:text-zinc-50 font-medium">{category.name}</span>
}
