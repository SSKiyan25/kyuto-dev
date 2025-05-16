import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const useExportAnalytics = () => {
  // Helper to format currency for UI and Excel (with proper symbol)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Helper to format currency for PDF (using text instead of symbol)
  const formatCurrencyForPDF = (value: number) => {
    return `PHP ${value.toFixed(2)}`;
  };

  // Export summary cards data to PDF
  const exportSummaryToPdf = (summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProductsViewed: number;
  }) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Sales Summary Report", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Create summary table
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", formatCurrencyForPDF(summary.totalRevenue)],
        ["Total Orders", summary.totalOrders.toLocaleString()],
        ["Total Product Views", summary.totalProductsViewed.toLocaleString()],
      ],
      startY: 40,
      styles: { fontSize: 12, cellPadding: 5 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Save PDF
    doc.save(`sales-summary-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Export summary cards data to Excel
  const exportSummaryToExcel = (summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProductsViewed: number;
  }) => {
    const data = [
      { Metric: "Total Revenue", Value: formatCurrency(summary.totalRevenue) },
      { Metric: "Total Orders", Value: summary.totalOrders.toLocaleString() },
      { Metric: "Total Product Views", Value: summary.totalProductsViewed.toLocaleString() },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

    // Set column widths
    worksheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

    // Save file
    XLSX.writeFile(workbook, `sales-summary-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export sales chart data
  const exportSalesChartToPdf = async (
    chartElement: HTMLElement,
    data: any[],
    timeRange: string
  ) => {
    // Create PDF
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(`Sales Trend (${timeRange})`, 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    try {
      // Capture chart as image
      const canvas = await html2canvas(chartElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Add chart image to PDF
      doc.addImage(imgData, "PNG", 10, 40, 190, 100);

      // Add data table below chart
      doc.addPage();
      autoTable(doc, {
        head: [["Date", "Revenue", "Orders"]],
        body: data.map((item) => [
          item.date,
          formatCurrencyForPDF(item.Revenue),
          item.Orders.toString(),
        ]),
        startY: 20,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Save PDF
      doc.save(`sales-trend-${timeRange}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  // Export sales chart data to Excel
  const exportSalesChartToExcel = (data: any[], timeRange: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        Date: item.date,
        Revenue: item.Revenue,
        Orders: item.Orders,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Trend");

    // Set column widths
    worksheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }];

    // Save file
    XLSX.writeFile(
      workbook,
      `sales-trend-${timeRange}-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Export comparison data
  const exportComparisonToPdf = async (chartElement: HTMLElement, data: any[]) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Order Type Comparison", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    try {
      // Capture chart as image
      const canvas = await html2canvas(chartElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Add chart image to PDF
      doc.addImage(imgData, "PNG", 50, 40, 110, 110);

      // Add data table below chart
      autoTable(doc, {
        head: [["Order Type", "Count"]],
        body: data.map((item) => [item.name, item.Total.toString()]),
        startY: 160,
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Save PDF
      doc.save(`order-comparison-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting comparison chart:", error);
    }
  };

  // Export comparison data to Excel
  const exportComparisonToExcel = (data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "Order Type": item.name,
        Count: item.Total,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Comparison");

    // Set column widths
    worksheet["!cols"] = [{ wch: 20 }, { wch: 10 }];

    // Save file
    XLSX.writeFile(workbook, `order-comparison-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export top products
  const exportTopProductsToPdf = (products: any[]) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Top Performing Products", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Create products table
    autoTable(doc, {
      head: [["Product Name", "Views", "Orders", "Quantity", "Revenue"]],
      body: products.map((product) => [
        product.name,
        product.viewCount.toString(),
        product.orderCount.toString(),
        product.totalQuantitySold.toString(),
        formatCurrencyForPDF(product.totalRevenue),
      ]),
      startY: 40,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Save PDF
    doc.save(`top-products-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Export top products to Excel
  const exportTopProductsToExcel = (products: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((product) => ({
        "Product Name": product.name,
        Views: product.viewCount,
        Orders: product.orderCount,
        Quantity: product.totalQuantitySold,
        Revenue: formatCurrency(product.totalRevenue),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Top Products");

    // Set column widths
    worksheet["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }];

    // Save file
    XLSX.writeFile(workbook, `top-products-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Detect mobile device
  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  return {
    exportSummaryToPdf,
    exportSummaryToExcel,
    exportSalesChartToPdf,
    exportSalesChartToExcel,
    exportComparisonToPdf,
    exportComparisonToExcel,
    exportTopProductsToPdf,
    exportTopProductsToExcel,
    isMobileDevice,
  };
};
