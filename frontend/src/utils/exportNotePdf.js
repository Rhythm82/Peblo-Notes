function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeFilename(title = 'PebloNotes-Note') {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

  return `${safeTitle || 'PebloNotes-Note'}.pdf`
}

function sanitizeHtml(html = '') {
  const template = document.createElement('template')
  template.innerHTML = html || ''

  template.content.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => {
    node.remove()
  })

  template.content.querySelectorAll('*').forEach((node) => {
    ;[...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()

      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name)
      }
    })
  })

  return template.innerHTML
}

function plainTextToHtml(text = '') {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function renderList(items = []) {
  if (!items.length) return ''

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function renderPills(items = []) {
  if (!items.length) return ''

  return items.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')
}

function buildAiSection(ai) {
  if (!ai?.summary) return ''

  return `
    <section class="section ai-section">
      <div class="section-heading">
        <h2>AI Study Summary</h2>
        <span class="difficulty">${escapeHtml(ai.difficulty || 'Beginner')}</span>
      </div>

      ${
        ai.suggested_title
          ? `<div class="soft-card">
              <h3>Suggested Title</h3>
              <p class="strong">${escapeHtml(ai.suggested_title)}</p>
            </div>`
          : ''
      }

      <div class="block">
        <h3>Summary</h3>
        <p>${escapeHtml(ai.summary)}</p>
      </div>

      ${
        ai.detailed_summary?.length
          ? `<div class="block">
              <h3>Detailed Summary</h3>
              <ul>${renderList(ai.detailed_summary)}</ul>
            </div>`
          : ''
      }

      ${
        ai.key_points?.length
          ? `<div class="block">
              <h3>Key Points</h3>
              <div class="pill-row">${renderPills(ai.key_points)}</div>
            </div>`
          : ''
      }

      ${
        ai.action_items?.length
          ? `<div class="block">
              <h3>Action Items</h3>
              <ul class="checks">${renderList(ai.action_items)}</ul>
            </div>`
          : ''
      }

      ${
        ai.quick_revision
          ? `<div class="revision">
              <h3>Quick Revision</h3>
              <p>${escapeHtml(ai.quick_revision)}</p>
            </div>`
          : ''
      }
    </section>
  `
}

function buildPdfHtml({ note, ai }) {
  const content = note.content
    ? sanitizeHtml(note.content)
    : plainTextToHtml(note.plainText || 'This note is still empty.')
  const tags = Array.isArray(note.tags) ? note.tags : []

  return `
    <style>
      .pdf-note {
        width: 190mm;
        box-sizing: border-box;
        background: #ffffff;
        color: #111827;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        line-height: 1.65;
        padding: 0;
      }

      .pdf-note * {
        box-sizing: border-box;
      }

      .brand {
        color: #0891b2;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0;
        margin: 0 0 10px;
      }

      h1 {
        color: #0f172a;
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 12px;
      }

      h2 {
        color: #0f172a;
        font-size: 18px;
        margin: 0;
      }

      h3 {
        color: #0e7490;
        font-size: 12px;
        font-weight: 900;
        margin: 0 0 6px;
        text-transform: uppercase;
      }

      p {
        margin: 0 0 10px;
      }

      ul, ol {
        margin: 8px 0 0 18px;
        padding: 0;
      }

      li {
        margin: 4px 0;
      }

      img {
        max-width: 100%;
        height: auto;
        border-radius: 10px;
      }

      pre, code {
        background: #f1f5f9;
        border-radius: 8px;
        color: #0f172a;
        font-family: "Cascadia Code", Consolas, monospace;
      }

      pre {
        overflow-wrap: anywhere;
        padding: 12px;
        white-space: pre-wrap;
      }

      code {
        padding: 2px 5px;
      }

      .meta {
        border-bottom: 1px solid #dbeafe;
        color: #475569;
        display: grid;
        gap: 6px;
        margin-bottom: 20px;
        padding-bottom: 16px;
      }

      .tag-row, .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tag, .pill {
        background: #ecfeff;
        border: 1px solid #bae6fd;
        border-radius: 999px;
        color: #155e75;
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        padding: 4px 9px;
      }

      .section {
        break-inside: auto;
        margin-top: 22px;
      }

      .section-heading {
        align-items: center;
        border-bottom: 1px solid #dbeafe;
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
      }

      .note-content {
        break-inside: auto;
      }

      .note-content h1,
      .note-content h2,
      .note-content h3 {
        color: #0f172a;
        margin: 16px 0 8px;
        text-transform: none;
      }

      .ai-section {
        background: #f8fdff;
        border: 1px solid #bae6fd;
        border-radius: 14px;
        padding: 14px;
      }

      .difficulty {
        background: #eef2ff;
        border: 1px solid #c4b5fd;
        border-radius: 999px;
        color: #5b21b6;
        font-size: 11px;
        font-weight: 900;
        padding: 4px 9px;
      }

      .soft-card,
      .revision {
        background: #ffffff;
        border: 1px solid #dbeafe;
        border-radius: 12px;
        margin: 10px 0;
        padding: 12px;
      }

      .revision {
        background: #f5f3ff;
        border-color: #ddd6fe;
      }

      .block {
        margin-top: 14px;
      }

      .strong {
        color: #0f172a;
        font-size: 15px;
        font-weight: 900;
      }

      .checks {
        list-style: none;
        margin-left: 0;
      }

      .checks li::before {
        color: #0891b2;
        content: "[ ] ";
        font-weight: 900;
      }

      .footer {
        border-top: 1px solid #dbeafe;
        color: #64748b;
        font-size: 11px;
        margin-top: 28px;
        padding-top: 10px;
        text-align: center;
      }
    </style>

    <article class="pdf-note">
      <p class="brand">PebloNotes / PabloNotes</p>
      <h1>${escapeHtml(note.title || 'Untitled Note')}</h1>

      <section class="meta">
        <div><strong>Category:</strong> ${escapeHtml(note.category || 'General')}</div>
        <div><strong>Last updated:</strong> ${escapeHtml(note.formattedDate || '')}</div>
        ${
          tags.length
            ? `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : ''
        }
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Original Note</h2>
        </div>
        <div class="note-content">${content}</div>
      </section>

      ${buildAiSection(ai)}

      <footer class="footer">Generated by PebloNotes</footer>
    </article>
  `
}
export async function exportNoteToPdf({ note, ai }) {
  if (!note) return

  const { default: html2pdf } = await import('html2pdf.js')

  const container = document.createElement('div')
  container.innerHTML = buildPdfHtml({ note, ai })

  container.style.position = 'fixed'
  container.style.left = '0'
  container.style.top = '0'
  container.style.width = '210mm'
  container.style.minHeight = '297mm'
  container.style.background = '#ffffff'
  container.style.padding = '10mm'
  container.style.boxSizing = 'border-box'
  container.style.opacity = '1'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '99999'

  document.body.appendChild(container)

  const pdfElement = container.querySelector('.pdf-note')

  try {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    if (!pdfElement) {
      throw new Error('PDF element was not created.')
    }

    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: sanitizeFilename(note.title),
        image: {
          type: 'jpeg',
          quality: 0.98,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          logging: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['.soft-card', '.revision'],
        },
      })
      .from(pdfElement)
      .save()
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('PDF export failed. Please try again.')
  } finally {
    container.remove()
  }
}