import jsPDF from 'jspdf';

export function exportTopicAsPDF(topic, questions) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 18;
    const contentW = W - margin * 2;
    let y = 0;

    const addPage = () => {
        doc.addPage();
        y = 18;
    };

    const checkY = (needed = 20) => {
        if (y + needed > 272) addPage();
    };

    // ── Cover Page ──────────────────────────────────────────────────────────────
    // Header bar
    doc.setFillColor(99, 60, 230); // primary violet
    doc.rect(0, 0, W, 52, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('TechPrep', margin, 24);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Interview Preparation Platform', margin, 33);

    doc.setFillColor(255, 255, 255, 0.15);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(margin, 43, W - margin, 43);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 49);

    // Topic name
    y = 72;
    doc.setTextColor(30, 20, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    const topicLines = doc.splitTextToSize(topic?.name || 'Questions', contentW);
    doc.text(topicLines, margin, y);
    y += topicLines.length * 9 + 4;

    // Description
    if (topic?.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100, 90, 130);
        const descLines = doc.splitTextToSize(topic.description, contentW);
        doc.text(descLines, margin, y);
        y += descLines.length * 6 + 6;
    }

    // Stats
    const basic = questions.filter(q => q.difficulty === 'basic').length;
    const medium = questions.filter(q => q.difficulty === 'medium').length;
    const experienced = questions.filter(q => q.difficulty === 'experienced').length;

    y += 6;
    doc.setFillColor(245, 243, 255);
    doc.rect(margin, y, contentW, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(99, 60, 230);
    doc.text(`${questions.length}`, margin + 8, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 70, 110);
    doc.text('Total Questions', margin + 8, y + 18);

    const col2x = margin + contentW / 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 160, 110);
    doc.text(`${basic}`, col2x, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 70, 110);
    doc.text('Basic', col2x, y + 18);

    const col3x = margin + (contentW / 3) * 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(220, 80, 40);
    doc.text(`${experienced}`, col3x, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 70, 110);
    doc.text('Experienced', col3x, y + 18);

    y += 40;

    // Divider
    doc.setDrawColor(220, 215, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);

    // ── Questions ───────────────────────────────────────────────────────────────
    addPage();

    questions.forEach((q, idx) => {
        // Estimate needed space
        const titleLines = doc.splitTextToSize(`${idx + 1}. ${q.title}`, contentW - 8);
        const descLines = q.description ? doc.splitTextToSize(q.description, contentW - 8) : [];
        const answerLines = q.answer ? doc.splitTextToSize(q.answer, contentW - 8) : [];
        const explanationLines = q.explanation ? doc.splitTextToSize(q.explanation, contentW - 8) : [];

        const estimatedH =
            titleLines.length * 6 +
            (descLines.length > 0 ? descLines.length * 5 + 6 : 0) +
            (answerLines.length > 0 ? answerLines.length * 5 + 14 : 0) +
            (explanationLines.length > 0 ? explanationLines.length * 5 + 10 : 0) +
            (q.code_snippet ? 20 : 0) +
            24;

        checkY(estimatedH);

        // Question card background
        doc.setFillColor(250, 249, 255);
        doc.rect(margin, y, contentW, 2, 'F');
        doc.setFillColor(99, 60, 230);
        doc.rect(margin, y, 3, 8, 'F'); // left accent

        // Difficulty badge
        const diff = q.difficulty || 'basic';
        if (diff === 'basic') doc.setTextColor(22, 160, 110);
        else if (diff === 'medium') doc.setTextColor(200, 140, 0);
        else doc.setTextColor(200, 60, 40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(diff.toUpperCase(), W - margin - 2, y + 5, { align: 'right' });

        // Question number + title
        doc.setTextColor(30, 20, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(titleLines, margin + 6, y + 8);
        y += titleLines.length * 6 + 6;

        // Description
        if (descLines.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80, 75, 100);
            doc.text(descLines, margin + 6, y);
            y += descLines.length * 5 + 4;
        }

        // MCQ options
        if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0) {
            y += 2;
            q.options.forEach((opt, i) => {
                checkY(8);
                const letter = String.fromCharCode(65 + i);
                const isCorrect = q.correct_option_index === i;
                if (isCorrect) {
                    doc.setFillColor(220, 252, 231);
                    doc.rect(margin + 6, y - 3.5, contentW - 6, 7, 'F');
                    doc.setTextColor(22, 160, 110);
                } else {
                    doc.setTextColor(80, 75, 100);
                }
                doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
                doc.setFontSize(9);
                doc.text(`${letter}. ${opt.text || ''}${isCorrect ? ' ✓' : ''}`, margin + 8, y + 2);
                y += 7;
            });
            y += 3;
        }

        // Answer section
        if (q.answer) {
            checkY(10);
            doc.setFillColor(240, 253, 244);
            const ansH = answerLines.length * 5 + 10;
            doc.rect(margin + 4, y, contentW - 4, ansH, 'F');
            doc.setDrawColor(22, 160, 110);
            doc.setLineWidth(0.8);
            doc.line(margin + 4, y, margin + 4, y + ansH);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(22, 160, 110);
            doc.text('ANSWER', margin + 8, y + 5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 20, 50);
            doc.text(answerLines, margin + 8, y + 10);
            y += ansH + 4;
        }

        // Explanation
        if (q.explanation) {
            checkY(10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(99, 60, 230);
            doc.text('EXPLANATION', margin + 6, y + 4);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80, 75, 100);
            doc.text(explanationLines, margin + 6, y + 10);
            y += explanationLines.length * 5 + 14;
        }

        // Separator
        doc.setDrawColor(220, 215, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, W - margin, y);
        y += 8;
    });

    // ── Footer on last page ──────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(160, 150, 180);
        doc.text(`TechPrep · ${topic?.name || ''} · Page ${i} of ${pageCount}`, W / 2, 290, { align: 'center' });
    }

    const safeName = (topic?.name || 'questions').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`techprep_${safeName}.pdf`);
}