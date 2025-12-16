'use client';

import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

export default function DownloadScheduleButton({ scheduleData }: { scheduleData: any[] }) {

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text("My Class Schedule", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);

        // Table Header
        let y = 50;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Time", 20, y);
        doc.text("Subject", 60, y);
        doc.text("Room", 140, y);

        // Line
        doc.setDrawColor(200);
        doc.line(20, y + 2, 190, y + 2);
        y += 10;

        // Rows
        doc.setTextColor(0);
        doc.setFontSize(12);

        scheduleData.forEach((item) => {
            const timeRange = `${item.startTime} - ${item.endTime}`;
            doc.text(timeRange, 20, y);
            doc.text(item.subject, 60, y); // Long text might need wrapping, kept simple for now
            doc.text(item.room, 140, y);
            y += 10;
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Automatic Timetable System", 20, 280);

        doc.save("schedule.pdf");
    };

    return (
        <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
            <Download className="w-4 h-4" />
            Download PDF
        </button>
    );
}
