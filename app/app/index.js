import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
    const [isConnected, setIsConnected] = useState(Platform.OS === 'web' ? false : null);

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
                <>
                    {/* <Image source={require('../assets/images/wifi.png')} style={styles.image} resizeMode="contain" /> */}
                    <ImageBackground
                        source={require('../assets/images/wifi.png')}
                        resizeMode="cover" // or "contain" or "stretch"
                        style={styles.image}
                    >
                        <View style={{width: '100%', height: '100%'}}>
                            Image
                        </View>
                    </ImageBackground>

                    <Text style={styles.message}>Please turn on the internet to use this app</Text>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        width: 150,
        height: 150,
        marginTop: 150,
        marginBottom: 10,
        backgroundColor: 'pink',
        alignSelf: 'center',
    },
    message: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 10,
        fontSize: '20px',
        fontWeight: 500,
        fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined,
        textTransform: 'uppercase',
        color: '#746e6e',
    },
});

export default App;
