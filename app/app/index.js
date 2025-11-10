import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
    const [isConnected, setIsConnected] = useState(Platform.OS === 'web' ? true : null);

    useEffect(() => {
        if (Platform.OS === 'web') {
            setIsConnected(navigator.onLine);

            const updateOnlineStatus = () => setIsConnected(navigator.onLine);
            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);

            return () => {
                window.removeEventListener('online', updateOnlineStatus);
                window.removeEventListener('offline', updateOnlineStatus);
            };
        } else {
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsConnected(state.isConnected);
            });
            return () => unsubscribe();
        }
    }, []);

    const url = `http://127.0.0.1:6100/deshboard?token=24fc8akm8o4s`;

    return (
        <View style={styles.container}>
            {isConnected === null ? (
                <Text style={styles.message}>Checking network...</Text>
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
                    <WebView source={{
                        uri: url,
                        headers: {
                            'X-From-App': 'SuperAITutor'
                        }
                    }} style={{ flex: 1 }} />
                )
            ) : (
                <Text style={styles.message}>Please turn on the internet to use this app.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    message: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 18,
        padding: 20,
    },
});

export default App;
