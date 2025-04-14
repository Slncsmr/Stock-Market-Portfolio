export const validStocks = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 
  'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'WIPRO', 'LT', 'AXISBANK', 
  'ASIANPAINT', 'MARUTI', 'KOTAKBANK', 'TATAMOTORS', 'SUNPHARMA', 
  'NESTLEIND', 'TITAN', 'BAJAJFINSV', 'ULTRACEMCO', 'TECHM', 'NTPC',
  'POWERGRID', 'HCLTECH', 'ITC', 'M&M', 'TATASTEEL', 'ONGC', 'ADANIENT'
];

export const isValidStock = (symbol) => {
  return validStocks.includes(symbol.toUpperCase());
};