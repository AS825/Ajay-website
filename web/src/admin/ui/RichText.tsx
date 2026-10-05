import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Undo2 } from 'lucide-react'
import type { Localized } from '@ajay/shared'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-10 place-items-center rounded-full ${active ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useTranslation()
  const link = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(t('admin.content.linkPrompt'), prev ?? 'https://')
    if (url === null) return
    if (!url) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  return (
    <div className="flex flex-wrap gap-1 border-b border-hairline p-1">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="H2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="H3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="List"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={link}>
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-4" />
      </ToolbarButton>
    </div>
  )
}

function Editor_({ html, onChange }: { html: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true } })],
    content: html,
    editorProps: { attributes: { class: 'rich-text min-h-48 px-4 py-3 focus:outline-none' } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })
  // External resets (discard) → replace content without emitting an update.
  useEffect(() => {
    if (editor && html !== editor.getHTML()) editor.commands.setContent(html, { emitUpdate: false })
  }, [editor, html])
  if (!editor) return null
  return (
    <div className="overflow-hidden rounded-[16px] border border-hairline bg-white/[0.04] focus-within:border-accent">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

/** Rich text (HTML) with EN/DE versions – for legal pages (SPEC §10.9). */
export function LocalizedRichText({
  label,
  value,
  onChange,
}: {
  label: string
  value: Localized
  onChange: (v: Localized) => void
}) {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'en' | 'de'>('de')
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <SegmentedControl
          label={t('admin.common.language')}
          value={lang}
          onChange={setLang}
          options={[
            { value: 'de', label: 'DE' },
            { value: 'en', label: 'EN' },
          ]}
        />
      </div>
      <Editor_
        key={lang}
        html={(lang === 'en' ? value.en : value.de) ?? ''}
        onChange={(html) =>
          onChange(lang === 'en' ? { ...value, en: html } : { ...value, de: html })
        }
      />
    </div>
  )
}
