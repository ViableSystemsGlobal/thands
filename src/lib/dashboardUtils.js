
export const getDateFilterRange = (dateRange) => {
  const now = new Date();
  let start = new Date(now);
  
  switch (dateRange) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case "7days":
      start.setDate(now.getDate() - 7);
      start.setHours(0,0,0,0);
      return { start, end: now };
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    default: 
      start = new Date(now.getFullYear(), now.getMonth(), 1); // Default to current month
      return { start, end: now };
  }
};

export const calculateMonthlySales = (orders) => {
  const months = {};
  const labels = [];
  const data = [];

  // Initialize months for the last 6 months including current
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
    const monthLabel = date.toLocaleString('default', { month: 'short' }); // e.g., 'Jan', 'Feb'
    months[monthKey] = 0;
    labels.push(monthLabel);
  }
  
  orders.forEach(order => {
    if (order.created_at && typeof order.created_at === 'string') {
      const monthKey = order.created_at.substring(0, 7); // YYYY-MM
      if (months.hasOwnProperty(monthKey)) {
        months[monthKey] += (order.total_amount || 0);
      }
    }
  });

  // Ensure data array matches labels array, even if no sales in some months
  labels.forEach((label, index) => {
    const year = new Date().getFullYear(); // Assuming current year for simplicity, adjust if needed for multi-year charts
    const monthIndex = new Date(Date.parse(label +" 1, " + year)).getMonth();
    const dateForMonthKey = new Date();
    dateForMonthKey.setMonth(new Date().getMonth() - (5 - index) ); // Align with the loop for labels
    const monthKey = dateForMonthKey.toISOString().substring(0,7);

    data.push(months[monthKey] || 0);
  });

  return { labels, data };
};
