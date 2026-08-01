const PDFDocument = require('pdfkit-table');

function formatCurrency(value, currency) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'XOF' }).format(value || 0);
  } catch (err) {
    return `${value || 0} ${currency || 'XOF'}`;
  }
}

function buildSalesReportPdf(report, hotelName, locale = 'fr-FR') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const margin = 40;
    const navy = '#0B1A2A';
    const gold = '#C9A227';
    const linen = '#F7F5F0';
    const gray = '#666666';

    const start = async () => {
      try {
        // Header background
        doc.rect(0, 0, pageWidth, 80).fill(navy);
        doc.fillColor(linen).fontSize(22).text(hotelName || 'Hestia', margin, 30);
        doc.fillColor(gold).fontSize(10).font('Helvetica-Bold').text('SALES REPORT', margin, 60);
        doc.fillColor('#999999').fontSize(9).font('Helvetica').text(`Generated ${new Date().toLocaleString(locale)}`, pageWidth - margin, 60, { align: 'right' });

        // Period
        const s = new Date(report.start).toLocaleDateString(locale);
        const e = new Date(report.end).toLocaleDateString(locale);
        const periodLabel = s === e ? s : `${s} - ${e}`;
        doc.y = 105;
        doc.fillColor(navy).fontSize(16).font('Helvetica-Bold').text(periodLabel, { align: 'center' });
        doc.y += 10;

        // Summary box
        const summaryY = doc.y + 5;
        doc.rect(margin, summaryY, pageWidth - margin * 2, 70).fill('#FAFAF7');
        doc.strokeColor(gold).lineWidth(2).moveTo(margin, summaryY).lineTo(pageWidth - margin, summaryY).stroke();
        doc.fillColor(navy).fontSize(11).font('Helvetica-Bold').text(`Total orders: ${report.totalOrders}`, margin + 10, summaryY + 25);
        doc.text(`Total revenue: ${formatCurrency(report.totalRevenue, report.currency)}`, margin + 10, summaryY + 45);
        doc.text(`Average order: ${formatCurrency(report.averageOrderValue, report.currency)}`, margin + 10, summaryY + 65);

        doc.y = summaryY + 90;

        const drawTitle = (title) => {
          doc.y += 15;
          doc.fillColor(navy).fontSize(13).font('Helvetica-Bold').text(title);
          doc.y += 5;
        };

        // Top items table
        drawTitle('Top selling items');
        await doc.table({
          headers: ['Item', 'Category', 'Qty', 'Revenue'],
          rows: report.topItems.slice(0, 8).map((it) => [
            it.name,
            it.category || '-',
            String(it.quantity),
            formatCurrency(it.revenue, report.currency),
          ]),
        }, {
          columnsSize: [150, 130, 40, 100],
        });

        // Category sales table
        drawTitle('Sales by category');
        await doc.table({
          headers: ['Category', 'Qty', 'Revenue'],
          rows: report.categorySales.map((c) => [
            c.category,
            String(c.quantity),
            formatCurrency(c.revenue, report.currency),
          ]),
        }, {
          columnsSize: [200, 80, 140],
        });

        // Recent orders table
        drawTitle('Recent orders');
        await doc.table({
          headers: ['Room', 'Items', 'Total', 'Date'],
          rows: report.orders.slice(0, 30).map((o) => [
            String(o.roomNumber),
            (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join(' | '),
            formatCurrency(o.total, report.currency),
            new Date(o.createdAt).toLocaleString(locale),
          ]),
        }, {
          columnsSize: [50, 190, 70, 120],
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    };

    start();
  });
}

module.exports = { buildSalesReportPdf, formatCurrency };
