const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default; // Add .default here
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

const validStocks = [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 
    'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'WIPRO', 'LT', 'AXISBANK', 
    'ASIANPAINT', 'MARUTI', 'KOTAKBANK', 'TATAMOTORS', 'SUNPHARMA', 
    'NESTLEIND', 'TITAN', 'BAJAJFINSV', 'ULTRACEMCO', 'TECHM', 'NTPC',
    'POWERGRID', 'HCLTECH', 'ITC', 'M&M', 'TATASTEEL', 'ONGC', 'ADANIENT'
];

const formatYahooSymbol = (symbol) => {
    return `${symbol}.NS`; // NS for NSE (National Stock Exchange)
};

const isIndianStock = (symbol) => {
    return validStocks.includes(symbol.toUpperCase());
};

const getStockQuote = async (symbol) => {
    try {
        // First try Yahoo Finance for Indian stocks
        if (isIndianStock(symbol)) {
            try {
                const yahooSymbol = formatYahooSymbol(symbol);
                const result = await yahooFinance.quote(yahooSymbol);
                
                return {
                    symbol: symbol,
                    currentPrice: result.regularMarketPrice,
                    dayHigh: result.regularMarketDayHigh,
                    dayLow: result.regularMarketDayLow,
                    volume: result.regularMarketVolume,
                    lastUpdated: new Date()
                };
            } catch (yahooError) {
                console.log('Yahoo Finance fetch failed, trying AlphaVantage');
            }
        }

        // For non-Indian stocks, verify API key first
        if (!API_KEY) {
            throw new Error('AlphaVantage API key not configured');
        }

        // Try Alpha Vantage API
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: API_KEY
            }
        });

        const data = response.data['Global Quote'];
        if (!data || Object.keys(data).length === 0) {
            if (response.data.Note) {
                throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
            }
            throw new Error(`No data found for symbol ${symbol}. For international stocks like IEX, please ensure the symbol is correct.`);
        }

        return {
            symbol: symbol,
            currentPrice: parseFloat(data['05. price']),
            dayHigh: parseFloat(data['03. high']),
            dayLow: parseFloat(data['04. low']),
            volume: parseInt(data['06. volume']),
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error fetching stock quote:', error.message);
        throw error;
    }
};

const getCompanyInfo = async (symbol) => {
    try {
        if (isIndianStock(symbol)) {
            // Use Yahoo Finance for Indian stocks
            const yahooSymbol = formatYahooSymbol(symbol);
            const result = await yahooFinance.quote(yahooSymbol);
            
            return {
                symbol: symbol,
                companyName: result.longName || result.shortName,
                description: 'Company information from Yahoo Finance',
                sector: result.sector || 'N/A',
                industry: result.industry || 'N/A'
            };
        }

        // Use Alpha Vantage for other stocks
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'OVERVIEW',
                symbol,
                apikey: API_KEY
            }
        });

        if (!response.data || response.data.Note) {
            throw new Error('No company info found');
        }

        return {
            symbol: symbol,
            companyName: response.data.Name,
            description: response.data.Description,
            sector: response.data.Sector,
            industry: response.data.Industry
        };
    } catch (error) {
        console.error('Error fetching company info:', error);
        throw error;
    }
};

module.exports = {
    getStockQuote,
    getCompanyInfo,
    isIndianStock
};