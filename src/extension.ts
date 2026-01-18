// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { KiteService } from './kiteService';

let kiteService: KiteService;
let statusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Kite Trading API extension is now active!');

	// Initialize Kite service
	kiteService = new KiteService();

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'kite.connect';
	updateStatusBar(false);
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('kite.connect', async () => {
			const initialized = kiteService.initialize();
			if (initialized) {
				const connected = await kiteService.testConnection();
				if (connected) {
					vscode.window.showInformationMessage('Successfully connected to Kite API!');
					updateStatusBar(true);
				} else {
					updateStatusBar(false);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.disconnect', () => {
			vscode.window.showInformationMessage('Disconnected from Kite API');
			updateStatusBar(false);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.getProfile', async () => {
			try {
				if (!kiteService.isConnected()) {
					vscode.window.showWarningMessage('Please connect to Kite API first');
					return;
				}
				const profile = await kiteService.getProfile();
				const panel = vscode.window.createWebviewPanel(
					'kiteProfile',
					'Kite Profile',
					vscode.ViewColumn.One,
					{ enableScripts: true }
				);
				panel.webview.html = getProfileHtml(profile);
			} catch (error: any) {
				vscode.window.showErrorMessage(error.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.getPositions', async () => {
			try {
				if (!kiteService.isConnected()) {
					vscode.window.showWarningMessage('Please connect to Kite API first');
					return;
				}
				const positions = await kiteService.getPositions();
				const panel = vscode.window.createWebviewPanel(
					'kitePositions',
					'Kite Positions',
					vscode.ViewColumn.One,
					{ enableScripts: true }
				);
				panel.webview.html = getPositionsHtml(positions);
			} catch (error: any) {
				vscode.window.showErrorMessage(error.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.getHoldings', async () => {
			try {
				if (!kiteService.isConnected()) {
					vscode.window.showWarningMessage('Please connect to Kite API first');
					return;
				}
				const holdings = await kiteService.getHoldings();
				const panel = vscode.window.createWebviewPanel(
					'kiteHoldings',
					'Kite Holdings',
					vscode.ViewColumn.One,
					{ enableScripts: true }
				);
				panel.webview.html = getHoldingsHtml(holdings);
			} catch (error: any) {
				vscode.window.showErrorMessage(error.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.generateLoginUrl', () => {
			const config = vscode.workspace.getConfiguration('kite');
			const apiKey = config.get('apiKey') as string;
			
			if (!apiKey) {
				vscode.window.showErrorMessage('Please set your API Key in settings first (kite.apiKey)');
				return;
			}

			const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}`;
			vscode.env.openExternal(vscode.Uri.parse(loginUrl));
			
			vscode.window.showInformationMessage(
				'Login URL opened in browser. After login, copy the request_token from URL and use "Kite: Set Access Token" command.',
				'Copy URL'
			).then(selection => {
				if (selection === 'Copy URL') {
					vscode.env.clipboard.writeText(loginUrl);
					vscode.window.showInformationMessage('Login URL copied to clipboard!');
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kite.setAccessToken', async () => {
			const token = await vscode.window.showInputBox({
				prompt: 'Enter your Access Token (or request_token to exchange)',
				password: true,
				placeHolder: 'Paste your access token here'
			});

			if (token) {
				const config = vscode.workspace.getConfiguration('kite');
				await config.update('accessToken', token, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage('Access Token saved! Now try "Kite: Connect to API"');
			}
		})
	);
}

function updateStatusBar(connected: boolean) {
	if (connected) {
		statusBarItem.text = "$(check) Kite Connected";
		statusBarItem.backgroundColor = undefined;
		statusBarItem.tooltip = "Connected to Kite API";
	} else {
		statusBarItem.text = "$(circle-slash) Kite Disconnected";
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		statusBarItem.tooltip = "Click to connect to Kite API";
	}
}

function getProfileHtml(data: any): string {
	const profile = data.data;
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; padding: 20px; }
				.field { margin: 10px 0; }
				.label { font-weight: bold; }
			</style>
		</head>
		<body>
			<h1>Kite Profile</h1>
			<div class="field"><span class="label">User ID:</span> ${profile.user_id}</div>
			<div class="field"><span class="label">Name:</span> ${profile.user_name}</div>
			<div class="field"><span class="label">Email:</span> ${profile.email}</div>
			<div class="field"><span class="label">Broker:</span> ${profile.broker}</div>
			<div class="field"><span class="label">Products:</span> ${profile.products.join(', ')}</div>
			<div class="field"><span class="label">Exchanges:</span> ${profile.exchanges.join(', ')}</div>
		</body>
		</html>
	`;
}

function getPositionsHtml(data: any): string {
	const positions = data.data.net;
	let rows = '';
	positions.forEach((pos: any) => {
		rows += `
			<tr>
				<td>${pos.tradingsymbol}</td>
				<td>${pos.quantity}</td>
				<td>${pos.average_price}</td>
				<td>${pos.last_price}</td>
				<td style="color: ${pos.pnl >= 0 ? 'green' : 'red'}">${pos.pnl.toFixed(2)}</td>
			</tr>
		`;
	});

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; padding: 20px; }
				table { width: 100%; border-collapse: collapse; }
				th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
				th { background-color: #4CAF50; color: white; }
			</style>
		</head>
		<body>
			<h1>Positions</h1>
			<table>
				<tr>
					<th>Symbol</th>
					<th>Quantity</th>
					<th>Avg Price</th>
					<th>Last Price</th>
					<th>P&L</th>
				</tr>
				${rows}
			</table>
		</body>
		</html>
	`;
}

function getHoldingsHtml(data: any): string {
	const holdings = data.data;
	let rows = '';
	holdings.forEach((holding: any) => {
		rows += `
			<tr>
				<td>${holding.tradingsymbol}</td>
				<td>${holding.quantity}</td>
				<td>${holding.average_price}</td>
				<td>${holding.last_price}</td>
				<td style="color: ${holding.pnl >= 0 ? 'green' : 'red'}">${holding.pnl.toFixed(2)}</td>
			</tr>
		`;
	});

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; padding: 20px; }
				table { width: 100%; border-collapse: collapse; }
				th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
				th { background-color: #4CAF50; color: white; }
			</style>
		</head>
		<body>
			<h1>Holdings</h1>
			<table>
				<tr>
					<th>Symbol</th>
					<th>Quantity</th>
					<th>Avg Price</th>
					<th>Last Price</th>
					<th>P&L</th>
				</tr>
				${rows}
			</table>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (statusBarItem) {
		statusBarItem.dispose();
	}
}

