import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export class KiteService {
    private apiKey: string = '';
    private accessToken: string = '';
    private apiClient: AxiosInstance;
    private baseUrl: string = 'https://api.kite.trade';

    constructor() {
        this.apiClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
        });
    }

    /**
     * Initialize the Kite API with credentials from VS Code settings
     */
    public initialize(): boolean {
        const config = vscode.workspace.getConfiguration('kite');
        this.apiKey = config.get('apiKey') || '';
        this.accessToken = config.get('accessToken') || '';

        if (!this.apiKey || !this.accessToken) {
            vscode.window.showErrorMessage(
                'Kite API credentials not configured. Please set your API Key and Access Token in settings.'
            );
            return false;
        }

        // Set up default headers
        this.apiClient.defaults.headers.common['X-Kite-Version'] = '3';
        this.apiClient.defaults.headers.common['Authorization'] = `token ${this.apiKey}:${this.accessToken}`;

        return true;
    }

    /**
     * Test the API connection
     */
    public async testConnection(): Promise<boolean> {
        try {
            const response = await this.apiClient.get('/user/profile');
            return response.status === 200;
        } catch (error: any) {
            vscode.window.showErrorMessage(`Connection failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get user profile
     */
    public async getProfile(): Promise<any> {
        try {
            const response = await this.apiClient.get('/user/profile');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get profile: ${error.message}`);
        }
    }

    /**
     * Get user margins
     */
    public async getMargins(): Promise<any> {
        try {
            const response = await this.apiClient.get('/user/margins');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get margins: ${error.message}`);
        }
    }

    /**
     * Get positions
     */
    public async getPositions(): Promise<any> {
        try {
            const response = await this.apiClient.get('/portfolio/positions');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get positions: ${error.message}`);
        }
    }

    /**
     * Get holdings
     */
    public async getHoldings(): Promise<any> {
        try {
            const response = await this.apiClient.get('/portfolio/holdings');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get holdings: ${error.message}`);
        }
    }

    /**
     * Get orders
     */
    public async getOrders(): Promise<any> {
        try {
            const response = await this.apiClient.get('/orders');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get orders: ${error.message}`);
        }
    }

    /**
     * Place an order
     */
    public async placeOrder(params: {
        exchange: string;
        tradingsymbol: string;
        transaction_type: 'BUY' | 'SELL';
        quantity: number;
        order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
        product: 'CNC' | 'MIS' | 'NRML';
        price?: number;
        trigger_price?: number;
    }): Promise<any> {
        try {
            const response = await this.apiClient.post('/orders/regular', params);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to place order: ${error.message}`);
        }
    }

    /**
     * Get quote for instruments
     */
    public async getQuote(instruments: string[]): Promise<any> {
        try {
            const response = await this.apiClient.get('/quote', {
                params: { i: instruments }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get quote: ${error.message}`);
        }
    }

    /**
     * Generate login URL for authentication
     */
    public getLoginUrl(): string {
        return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}`;
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.apiKey !== '' && this.accessToken !== '';
    }
}
