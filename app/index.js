import { registerRootComponent } from 'expo';
import App from './app/index.js'; // 👈 This securely imports your code from your app folder

// Registers the imported App component as the true root of the application
registerRootComponent(App); 
