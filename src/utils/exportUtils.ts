import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { ChatMessage } from '@/hooks/useChatMessages';

interface ExportOptions {
    title: string;
    language: 'ar' | 'en';
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const exportToWord = async ({ title, language, messages }: ExportOptions) => {
    const isAr = language === 'ar';

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 720,
                        right: 720,
                        bottom: 720,
                        left: 720,
                    },
                },
            },
            children: [
                new Paragraph({
                    text: title,
                    heading: HeadingLevel.HEADING_1,
                    alignment: isAr ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    spacing: { after: 400 },
                }),
                ...messages.flatMap((m) => [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: m.role === 'user' ? (isAr ? 'أنت:' : 'You:') : (isAr ? 'المعلم الذكي:' : 'AI Teacher:'),
                                bold: true,
                                color: m.role === 'user' ? '6366f1' : '10b981',
                            }),
                        ],
                        alignment: isAr ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        spacing: { before: 200 },
                    }),
                    ...m.content.split('\n').map(line =>
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                }),
                            ],
                            alignment: isAr ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        })
                    ),
                    new Paragraph({
                        children: [],
                        spacing: { after: 200 },
                    })
                ]),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/\s+/g, '_')}_${Date.now()}.docx`);
};

export const exportToPDF = async ({ title, language, messages }: ExportOptions) => {
    const isAr = language === 'ar';

    // jsPDF's built-in fonts cannot render Arabic glyphs (they come out as boxes/symbols).
    // Instead we render a properly styled HTML document to a canvas, then place it into
    // the PDF as a paginated image — this preserves Arabic shaping and RTL layout perfectly.
    const escapeHtml = (str: string) =>
        str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

    const container = document.createElement('div');
    container.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '0';
    container.style.width = '794px'; // ~A4 width at 96dpi
    container.style.padding = '40px';
    container.style.boxSizing = 'border-box';
    container.style.background = '#ffffff';
    container.style.color = '#1f2937';
    container.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
    container.style.lineHeight = '1.9';
    container.style.textAlign = isAr ? 'right' : 'left';

    const messagesHtml = messages
        .map((m) => {
            const roleLabel =
                m.role === 'user'
                    ? isAr ? 'أنت' : 'You'
                    : isAr ? 'المعلم الذكي' : 'AI Teacher';
            const roleColor = m.role === 'user' ? '#6366f1' : '#10b981';
            return `
                <div style="margin-bottom:20px;padding:16px 18px;border-radius:12px;background:#f8fafc;border-${isAr ? 'right' : 'left'}:4px solid ${roleColor};">
                    <div style="font-weight:700;color:${roleColor};margin-bottom:8px;">${roleLabel}</div>
                    <div style="font-size:15px;white-space:normal;">${escapeHtml(m.content)}</div>
                </div>`;
        })
        .join('');

    container.innerHTML = `
        <h1 style="font-size:26px;font-weight:800;color:#6366f1;margin:0 0 24px;border-bottom:2px solid #6366f1;padding-bottom:10px;">${escapeHtml(title)}</h1>
        ${messagesHtml}
    `;

    document.body.appendChild(container);

    try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
        });

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;
        const imgData = canvas.toDataURL('image/png');

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position -= pageHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } finally {
        document.body.removeChild(container);
    }
};
