const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

const formatSymbol = (symbol) => {
    // Mapping of stocks to their Yahoo Finance symbols for Indian stocks
    const indianStockMap = {
        'INFY': 'INFY.NS',
        'TCS': 'TCS.NS',
        'RELIANCE': 'RELIANCE.NS'
    };
    
    return indianStockMap[symbol.toUpperCase()] || symbol;
};

const getStockQuote = async (symbol) => {
    try {
        const formattedSymbol = formatSymbol(symbol);
        
        // Use Yahoo Finance for Indian stocks
        if (formattedSymbol.endsWith('.NS')) {
            const quote = await yahooFinance.quote(formattedSymbol);
            return {
                symbol: symbol, // Return original symbol without suffix
                currentPrice: quote.regularMarketPrice,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                volume: quote.regularMarketVolume,
                lastUpdated: new Date()
            };
        }
        
        // Use Alpha Vantage for other stocks
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: formattedSymbol,
                apikey: API_KEY
            }
        });

        const data = response.data['Global Quote'];
        if (!data) {
            throw new Error(`No data found for symbol ${formattedSymbol}`);
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
        console.error('Error fetching stock quote:', error);
        throw error;
    }
};

const getCompanyInfo = async (symbol) => {
    try {
        const formattedSymbol = formatSymbol(symbol);
        
        // Use Yahoo Finance for Indian stocks
        if (formattedSymbol.endsWith('.NS')) {
            const quote = await yahooFinance.quoteSummary(formattedSymbol, { modules: ['summaryProfile'] });
            return {
                symbol: symbol,
                companyName: quote.summaryProfile.name || symbol,
                description: quote.summaryProfile.longBusinessSummary || '',
                sector: quote.summaryProfile.sector || '',
                industry: quote.summaryProfile.industry || ''
            };
        }

        // Use Alpha Vantage for other stocks
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'OVERVIEW',
                symbol: formattedSymbol,
                apikey: API_KEY
            }
        });

        if (!response.data || response.data.Note) {
            throw new Error(`No company info found for ${formattedSymbol}`);
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
    getCompanyInfo
};