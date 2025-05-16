import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { ExtendedOrder } from "./useFetchFilterOrders";

export const useExportOrders = () => {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Object && "toDate" in timestamp
        ? timestamp.toDate()
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const prepareOrdersData = (orders: ExtendedOrder[]) => {
    return orders.map((order) => ({
      Reference: order.uniqRefNumber || "N/A",
      Date: formatDate(order.dateOrdered),
      Customer: order.buyerAccountDetails?.email || "N/A",
      Status: order.orderStatus,
      Payment: order.paymentStatus === "not_paid" ? "Unpaid" : order.paymentStatus,
      Total: `₱${Number(order.totalPrice).toFixed(2)}`,
      Items: order.orderItems
        .map(
          (item) =>
            `${item.quantity}x ${item.productDetails?.name || "Unknown"} ${item.variationDetails?.value ? `(${item.variationDetails.value})` : ""}`
        )
        .join(", "),
    }));
  };

  const exportToPdf = (orders: ExtendedOrder[], status: string = "all") => {
    // Check if running on client-side
    if (typeof window === "undefined") return;

    // Create PDF with explicit UTF-8 encoding
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add custom font with currency symbol support
    // You might need to add additional fonts to support ₱ properly
    // For now, we'll use a text replacement approach

    const pesoSymbol = "PHP"; // Use text "PHP" instead of ₱ symbol to ensure compatibility
    const formattedOrders = prepareOrdersData(orders);

    // Format the orders to use the text-based peso symbol
    const safeFormattedOrders = formattedOrders.map((order) => ({
      ...order,
      Total: order.Total.replace("₱", pesoSymbol + " "),
    }));

    // Add title
    const title = `Orders Report - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Create main table
    autoTable(doc, {
      head: [["Reference", "Date", "Customer", "Status", "Payment", "Total"]],
      body: safeFormattedOrders.map((order) => [
        order.Reference,
        order.Date,
        order.Customer,
        order.Status,
        order.Payment,
        order.Total,
      ]),
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    // Get final Y position after main table
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    let newY = finalY + 10;

    // Add item details for each order
    doc.setFontSize(14);
    doc.text("Order Details", 14, newY);
    newY += 8;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      // Check if we need a new page
      if (newY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        newY = 20;
      }

      // Add order reference header
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Order: ${order.uniqRefNumber || "N/A"}`, 14, newY);
      newY += 5;

      // Add items
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Create a formatted list of items with prices
      if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach((item) => {
          // Create item string with proper price formatting
          const price = (item.priceWithCommission || 0).toFixed(2);
          const total = ((item.priceWithCommission || 0) * item.quantity).toFixed(2);
          const itemText = `• ${item.quantity}x ${item.productDetails?.name || "Unknown Product"} ${
            item.variationDetails?.value ? `(${item.variationDetails.value})` : ""
          } - ${pesoSymbol} ${price} each = ${pesoSymbol} ${total}`;

          // Split text to handle long lines
          const textLines = doc.splitTextToSize(itemText, 180);

          // Check if we need a new page for this item
          if (newY + textLines.length * 4 > doc.internal.pageSize.height - 15) {
            doc.addPage();
            newY = 20;
          }

          doc.text(textLines, 18, newY);
          newY += textLines.length * 4;
        });
      } else {
        doc.text("• No items", 18, newY);
        newY += 4;
      }

      // Add order total
      doc.setFont("helvetica", "bold");
      doc.text(`Total: ${pesoSymbol} ${(Number(order.totalPrice) || 0).toFixed(2)}`, 18, newY + 2);
      newY += 8;

      // Add separator
      doc.setDrawColor(200, 200, 200);
      doc.line(14, newY, 196, newY);
      newY += 8;
    }

    // Save PDF
    doc.save(`orders-${status}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToExcel = (orders: ExtendedOrder[], status: string = "all") => {
    if (typeof window === "undefined") return;

    const formattedOrders = prepareOrdersData(orders);
    const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Reference
      { wch: 15 }, // Date
      { wch: 25 }, // Customer
      { wch: 12 }, // Status
      { wch: 12 }, // Payment
      { wch: 12 }, // Total
      { wch: 50 }, // Items
    ];
    worksheet["!cols"] = columnWidths;

    // Generate filename
    const fileName = `orders-${status}-${new Date().toISOString().split("T")[0]}.xlsx`;

    // Export to file
    XLSX.writeFile(workbook, fileName);
  };

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  return {
    exportToPdf,
    exportToExcel,
    isMobileDevice,
  };
};
