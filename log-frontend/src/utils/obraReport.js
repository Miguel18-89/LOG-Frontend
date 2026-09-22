// Import nomeado: é o que o jsPDF documenta e o único que funciona tanto no
// bundler como em Node (onde o export default é o namespace, não o construtor).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = [245, 124, 0];

export const OBRA_TYPES = [
    { value: 'instalacao', label: 'Instalação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'reparacao', label: 'Reparação' },
];

export const OBRA_STATUS = [
    { value: 'em_curso', label: 'Em curso' },
    { value: 'concluida', label: 'Concluída' },
];

export function obraTypeLabel(value) {
    return OBRA_TYPES.find(t => t.value === value)?.label ?? value;
}

export function obraStatusLabel(value) {
    return OBRA_STATUS.find(s => s.value === value)?.label ?? value;
}

/** "08:30 — 17:00", "a partir das 08:30", ou '' se não houver horas. */
export function formatTimeRange(startTime, endTime) {
    if (startTime && endTime) return `${startTime} — ${endTime}`;
    if (startTime) return `a partir das ${startTime}`;
    if (endTime) return `até às ${endTime}`;
    return '';
}

export function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('pt-PT') : '—';
}

/** Técnicos do Pessoal e ocasionais numa só lista, para mostrar e imprimir. */
export function allTechnicianNames(obra) {
    return [
        ...(obra?.technicians ?? []).map(t => t.fullName),
        ...(obra?.externalTechnicians ?? []),
    ];
}

/**
 * Reduz uma foto antes de a meter no PDF. Sem isto, meia dúzia de fotos de
 * telemóvel geram um PDF de dezenas de MB que não passa por email.
 */
export function shrinkImage(blob, maxSide = 900, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            // Fundo branco: PNGs transparentes ficariam pretos ao converter para JPEG.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', quality),
                width: canvas.width,
                height: canvas.height,
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Não foi possível ler a imagem'));
        };
        img.src = url;
    });
}

/**
 * Constrói o PDF da folha de obra e devolve o documento jsPDF.
 * `photos` é opcional: lista de {dataUrl, width, height} já redimensionados.
 */
export function buildObraPDF(obra, photos = []) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(...BRAND);
    doc.text('Folha de Obra', 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`#${obra.orderNumber}`, pageWidth - 14, 18, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, 14, 24);
    doc.setTextColor(0);

    autoTable(doc, {
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 38, fontStyle: 'bold', fillColor: [255, 243, 224] },
        },
        body: [
            ['Cliente', obra.client],
            ['Obra / Local', obra.obra],
            ['Tipo de trabalho', obraTypeLabel(obra.type)],
            ['Estado', obraStatusLabel(obra.status)],
            ['Data', fmtDate(obra.date)],
            ['Horário', formatTimeRange(obra.startTime, obra.endTime) || '—'],
            ['Técnicos', allTechnicianNames(obra).join(', ') || '—'],
            // A origem só aparece quando a obra nasceu de um pedido: numa obra
            // avulsa uma linha "Origem: —" só ocuparia espaço.
            ...(obra.ticket
                ? [['Origem', `Ticket #${obra.ticket.ticketNumber} — ${obra.ticket.title}`]]
                : []),
        ],
    });

    const section = (title, text) => {
        autoTable(doc, {
            startY: (doc.lastAutoTable?.finalY ?? 30) + 6,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
            head: [[title]],
            body: [[text || '—']],
        });
    };

    section('Tarefas efetuadas', obra.tasks);
    section('Materiais aplicados', obra.materials);
    if (obra.notes) section('Observações', obra.notes);

    // Registo fotográfico: 2 por linha, cada uma com altura máxima fixa.
    if (photos.length > 0) {
        const margin = 14;
        const gap = 6;
        const usable = pageWidth - margin * 2;
        const cellW = (usable - gap) / 2;
        const maxCellH = 55;
        const pageH = doc.internal.pageSize.getHeight();

        let py = (doc.lastAutoTable?.finalY ?? 30) + 10;

        const drawHeading = () => {
            doc.setFontSize(10);
            doc.setTextColor(...BRAND);
            doc.text('Registo fotográfico', margin, py);
            doc.setTextColor(0);
            py += 4;
        };

        if (py + maxCellH + 10 > pageH - margin) { doc.addPage(); py = 20; }
        drawHeading();

        // Legenda por baixo de cada foto, quando existe.
        const CAPTION_SIZE = 7;
        const CAPTION_LINE = 3;   // altura de uma linha, em mm
        const CAPTION_GAP = 3;    // espaço entre a foto e a legenda

        for (let i = 0; i < photos.length; i += 2) {
            const row = photos.slice(i, i + 2);
            const imgHeights = row.map(p => Math.min(maxCellH, (cellW * p.height) / p.width));

            // O corte em linhas depende do tamanho de letra em vigor, por isso
            // define-se antes de medir e não só antes de escrever.
            doc.setFontSize(CAPTION_SIZE);
            const capLines = row.map(p => (p.caption ? doc.splitTextToSize(p.caption, cellW) : []));
            const capHeights = capLines.map(l => (l.length ? CAPTION_GAP + l.length * CAPTION_LINE : 0));
            const rowH = Math.max(...imgHeights.map((h, k) => h + capHeights[k]));

            if (py + rowH > pageH - margin) {
                doc.addPage();
                py = 20;
                drawHeading();
            }

            row.forEach((p, idx) => {
                const h = imgHeights[idx];
                const w = (h * p.width) / p.height;
                const x = margin + idx * (cellW + gap);
                doc.addImage(p.dataUrl, 'JPEG', x, py, w, h);

                if (capLines[idx].length) {
                    doc.setFontSize(CAPTION_SIZE);
                    doc.setTextColor(90);
                    doc.text(capLines[idx], x, py + h + CAPTION_GAP);
                    doc.setTextColor(0);
                }
            });

            py += rowH + gap;
        }

        // O bloco da assinatura arranca depois das fotos, não da última tabela.
        doc.lastAutoTable = { finalY: py };
    }

    // Assinatura: se não couber no que resta da página, começa uma nova.
    let y = (doc.lastAutoTable?.finalY ?? 30) + 12;
    const blockHeight = 46;
    if (y + blockHeight > doc.internal.pageSize.getHeight() - 14) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Confirmação do cliente', 14, y);
    doc.setDrawColor(200);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    if (obra.signatureData) {
        doc.addImage(obra.signatureData, 'PNG', 14, y + 6, 70, 28);
        doc.setFontSize(8);
        doc.setTextColor(60);
        doc.text(`${obra.signedByName ?? ''}`, 14, y + 39);
        doc.setTextColor(150);
        doc.text(
            `Assinado em ${obra.signedAt ? new Date(obra.signedAt).toLocaleString('pt-PT') : '—'}`,
            14, y + 43,
        );
    } else {
        doc.setFontSize(9);
        doc.setTextColor(170);
        doc.text('Por assinar.', 14, y + 12);
    }

    return doc;
}

export function obraFileName(obra) {
    const safeObra = String(obra.obra).replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '');
    const dateStr = new Date(obra.date).toISOString().slice(0, 10);
    return `folha-obra-${obra.orderNumber}-${safeObra}-${dateStr}.pdf`;
}

export function downloadObraPDF(obra, photos = []) {
    buildObraPDF(obra, photos).save(obraFileName(obra));
}

export function obraPDFBase64(obra, photos = []) {
    return buildObraPDF(obra, photos).output('datauristring').split(',')[1];
}
