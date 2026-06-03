import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { ImageBackground, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import system from '../utils/setup-system';


const App = () => {
    const token = system.encrypt(system.access_token);
    const serverLink = system.server_link();

    const [isConnected, setIsConnected] = useState(Platform.OS === 'web' ? false : null);
    
    useEffect(() => {
        if (Platform.OS === 'web') {
            setIsConnected(navigator.onLine);
            
            const checkOnline = async () => {
                try {
                    const response = await fetch(`${system.server_link()}/ping`, { method: 'GET', headers: {'Authorization': `Bearer ${system.access_token}`} });
                    console.log('fetch is called from app:\n\n'+response);
                    setIsConnected(true);
                } catch(err) {
                    console.log("Web connectivity error:", err);
                    setIsConnected(isConnected ? true : false); 
                }
            };
            checkOnline();

            const updateOnlineStatus = () => checkOnline();
            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            return () => {
                window.removeEventListener('online', updateOnlineStatus);
                window.removeEventListener('offline', updateOnlineStatus);
            };
        } else {
            const unsubscribe = NetInfo.addEventListener(state => {
                console.log("Mobile connectivity check:", state);
                if (state.isConnected === null) {
                    setIsConnected(null);
                } else {
                    setIsConnected(!!(state.isConnected && state.isInternetReachable !== false));
                }
            });
            return () => unsubscribe();
        }
    }, []);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const iframe = document.querySelector('iframe');
        if (!iframe) return;

        const injectCSS = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc || !doc.head) return;

                const oldStyle = doc.getElementById('custom-style');
                if (oldStyle) oldStyle.remove();

                const style = doc.createElement('style');
                style.id = 'custom-style';
                style.textContent = `
                    iframe{
                        body { width:100%; overflow: hidden; }
                        .page { scrollbar-color: transparent transparent; }
                    }
                `;
                doc.head.appendChild(style);
                console.log("CSS injected into iframe");
            } catch (err) {
                console.error("Failed to inject CSS:", err);
            }
        };

        iframe.addEventListener('load', injectCSS);
        if (iframe.contentDocument?.readyState === 'complete') {
            injectCSS();
        }
        const observer = new MutationObserver(() => injectCSS());
        observer.observe(iframe, { attributes: true, childList: true, subtree: true });
        return () => {
            iframe.removeEventListener('load', injectCSS);
            // observer.disconnect();
        };
    }, []);

    const url = `${serverLink}/dashboard?token=${encodeURIComponent(token)}&fromApp=superAITutor`;

    return (
        <View style={styles.container}>
            {isConnected === null ? (
                <View style={styles.errorWrapper}>
                    <Text style={styles.message}>Checking network permissions...</Text>
                </View>
            ) : isConnected ? (
                Platform.OS === 'web' ? (
                    <div style={{ width: '100vw', height: '100vh', border: 'none' }}>
                        <iframe
                            src={url}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="SuperAITutor"
                        />
                    </div>
                ) : (
                    <WebView 
                        source={{ uri: url }} 
                        style={{ flex: 1 }} 
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        scalesPageToFit={true}
                        originWhitelist={['*']} 
                        mixedContentMode="always"
                        setSupportMultipleWindows={false} 
                        sharedCookiesEnabled={true} 
                    />
                )
            ) : (
                <View style={styles.errorWrapper}>
                    <ImageBackground
                        source={require('../assets/images/wifi.png')}
                        resizeMode="contain"
                        style={styles.image}
                    >
                        <View style={{width: '100%', height: '100%'}} />
                    </ImageBackground>

                    <Text style={styles.message}>Please turn on the connection to use this app</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    errorWrapper: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f6f6f6',
    },
    image: {
        width: 150,
        height: 150,
        marginTop: 150,
        marginBottom: 10,
        alignSelf: 'center',
        zIndex: 10,
    },
    imageStyle: {
        backgroundImage: Platform.OS === 'web' ?"url('/wifi.png')":'',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    message: {
        // flex: 1,
        textAlign: 'center',
        // textAlignVertical: 'center',
        // justifyContent: 'center',
        // alignItems: 'center',
        padding: 20,
        marginTop: 10,
        fontSize: 20,
        fontWeight: '500',
        fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined,
        textTransform: 'uppercase',
        color: '#746e6e',
    },
});

export default App;
