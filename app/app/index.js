import NetInfo from '@react-native-community/netinfo';
import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import system from '../utils/setup-system';

class ErrorBoundary extends Component {
    state = { hasError: false, error: null, errorInfo: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.log("Captured Global App Crash:", error, errorInfo);
        this.setState({ errorInfo });
    }

    parseCrashDetails() {
        if (!this.state.errorInfo || !this.state.errorInfo.componentStack) {
            return { file: 'Unknown File Location', line: 'N/A', column: 'N/A', func: 'Main Render Thread' };
        }

        try {
            const stack = this.state.errorInfo.componentStack;
            const match = stack.match(/at\s+([^\s]+)\s+\(address\s+at\s+([^:]+):(\d+):(\d+)\)/) ||
                stack.match(/at\s+([^\s]+)\s+\(([^:]+):(\d+):(\d+)\)/);

            if (match) {
                return {
                    func: match[1] || 'Anonymous Function',
                    file: match[2] || 'index.android.bundle',
                    line: match[3] || 'Unknown Line',
                    column: match[4] || 'Unknown Column'
                };
            }
        } catch (e) {
            console.error("Failed to parse stack trace string:", e);
        }
        return { file: 'index.android.bundle', line: 'Coordinates Pending parsing', column: 'N/A', func: 'AppMain Pipeline' };
    }

    render() {
        if (this.state.hasError) {
            const details = this.parseCrashDetails();
            return (
                <View style={styles.crashContainer}>
                    <Text style={styles.crashHeader}>⚠️ CRASH DETECTED BY APP CONTAINER</Text>
                    <Text style={styles.crashMessage}>
                        {this.state.error ? this.state.error.toString() : 'Unknown Native Error'}
                    </Text>
                    <View style={styles.crashBox}>
                        <Text style={styles.crashBoxText}><Text style={styles.boldText}>CRASHING FUNCTION:</Text> {details.func}()</Text>
                        <Text style={styles.crashBoxText}><Text style={styles.boldText}>TARGET BUNDLE FILE:</Text> {details.file}</Text>
                        <Text style={styles.crashBoxText}><Text style={styles.boldText}>EXACT BUNDLE LINE:</Text> {details.line}</Text>
                        <Text style={styles.crashBoxText}><Text style={styles.boldText}>BUNDLE COLUMN CODE:</Text> {details.column}</Text>
                    </View>

                    <Text style={styles.crashSubHeader}>Raw Execution Trace Matrix:</Text>
                    <Text style={styles.crashDetails} numberOfLines={8}>
                        {this.state.errorInfo ? this.state.errorInfo.componentStack.trim() : 'No stack trace details found.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.crashButton}
                        onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    >
                        <Text style={styles.crashButtonText}>RETRY APP LAUNCH</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const AppMain = () => {
    const token = system.encrypt(system.access_token);

    const serverLink = system.server_link();

    const [isConnected, setIsConnected] = useState(Platform.OS === 'web' ? false : null);

    const webViewRef = useRef(null);
    // const [historyStack, setHistoryStack] = useState([]);
    const historyStackRef = useRef([]);
    const currentUrlRef = useRef('');
    
    // change
    const initialUrl = `${serverLink}/dashboard?token=${encodeURIComponent(token)}&fromApp=superAITutor`;
    const webViewSource = useMemo(() => ({ uri: initialUrl }), [serverLink, token]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            setIsConnected(navigator.onLine);

            const checkOnline = async () => {
                try {
                    const response = await fetch(`${system.server_link()}/ping`, { method: 'GET', headers: { 'Authorization': `Bearer ${system.access_token}` } });
                    console.log('fetch is called from app:\n\n' + response);
                    setIsConnected(true);
                } catch (err) {
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
        if (Platform.OS === 'web') return;

        const handleBackPress = () => {
            try {
                // if ((webViewRef.current && typeof webViewRef.current.injectJavaScript === 'function') && (Array.isArray(historyStack) && historyStack.length > 1)) {
                const stack = historyStackRef.current;
                if (webViewRef.current && Array.isArray(stack) && stack.length > 1) {
                    stack.pop();
                    // const updatedStack = [...historyStack];

                    // updatedStack.pop();

                    // const previousUrl = updatedStack[updatedStack.length - 1];
                    const previousUrl = stack[stack.length - 1];

                    if (!previousUrl) return false; 

                    // setHistoryStack(updatedStack);

                    const injectScript = `
                        (function() {
                            try {
                                if (typeof window.route === 'function') {
                                    window.route("${previousUrl}");
                                } else {
                                    window.location.href = "${previousUrl}";
                                }
                            } catch (e) {
                                window.location.href = "${previousUrl}";
                            }
                        })();
                        true;
                    `;

                    if (webViewRef.current && typeof webViewRef.current.injectJavaScript === 'function') {
                        webViewRef.current.injectJavaScript(injectScript);
                    }
                    return true;
                }
            } catch (error) {
                console.error("BackHandler operational exception:", error);
            }
            return false;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => subscription.remove();
    // }, [historyStack]);
    }, []);

    const handleNavigationStateChange = (navState) => {
        try {
            const detectedUrl = navState.url;
            if (!detectedUrl || detectedUrl === 'about:blank') return;

            if (detectedUrl !== currentUrlRef.current) {
                currentUrlRef.current = detectedUrl;

                // setHistoryStack((prevStack) => {
                //     const cleanStack = Array.isArray(prevStack) ? prevStack : [];
                //     if (cleanStack[cleanStack.length - 1] === detectedUrl) {
                //         return cleanStack;
                //     }
                //     return [...cleanStack, detectedUrl];
                // });
                const stack = historyStackRef.current;
                if (stack[stack.length - 1] !== detectedUrl) {
                    stack.push(detectedUrl);
                }
            }
        } catch (e) {
            console.error("Navigation state change tracker failure:", e);
        }
    };

    // const url = `${serverLink}/dashboard?token=${encodeURIComponent(token)}&fromApp=superAITutor`;

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />
            {isConnected === null ? (
                <View style={styles.errorWrapper}>
                    <Text style={styles.message}>Checking network permissions...</Text>
                </View>
            ) : isConnected ? (
                Platform.OS === 'web' ? (
                    <div style={{ width: '100vw', height: '100vh', border: 'none' }}>
                        <iframe
                            src={initialUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="SuperAITutor"
                        />
                    </div>
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={webViewSource}
                        style={{ flex: 1 }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        thirdPartyCookiesEnabled={true}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        setSupportMultipleWindows={false}
                        sharedCookiesEnabled={true}
                        databaseEnabled={true}
                        onNavigationStateChange={handleNavigationStateChange}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView native connection error: ', nativeEvent);
                        }}
                    />
                )
            ) : (
                <View style={styles.errorWrapper}>
                    <ImageBackground
                        source={require('../assets/images/wifi.png')}
                        resizeMode="contain"
                        style={styles.image}
                    >
                        <View style={{ width: '100%', height: '100%' }} />
                    </ImageBackground>

                    <Text style={styles.message}>Please turn on the connection to use this app</Text>

                    <Text style={styles.versionText}>v {system.version}</Text>
                </View>
            )}
        </View>
    );
};

export default function App() {
    return (
        <ErrorBoundary>
            <AppMain />
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        backgroundColor: 'transparent',
    },
    errorWrapper: {
        flex: 1,
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
        backgroundImage: Platform.OS === 'web' ? "url('/wifi.png')" : '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    message: {
        textAlign: 'center',
        padding: 20,
        marginTop: 10,
        fontSize: 20,
        fontWeight: '500',
        fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined,
        textTransform: 'uppercase',
        color: '#746e6e',
    },
    versionText: {
        position: 'absolute',
        bottom: '10%',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
        color: '#a9a9a9',
        textTransform: 'lowercase',
    },

    crashContainer: {
        flex: 1,
        backgroundColor: '#1e0000',
        padding: 20,
        justifyContent: 'center',
    },
    crashHeader: {
        fontSize: 20,
        color: '#ff4d4d',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    crashLabel: {
        color: '#ff9999',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    crashMessage: {
        fontSize: 15,
        color: '#ffffff',
        backgroundColor: '#3a0000',
        padding: 12,
        borderRadius: 6,
        fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
        marginBottom: 15,
    },
    crashBox: {
        backgroundColor: '#2b0000',
        borderColor: '#ff4d4d',
        borderWidth: 1,
        borderRadius: 6,
        padding: 12,
        marginBottom: 15,
    },
    crashBoxText: {
        color: '#ffffff',
        fontSize: 13,
        fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
        marginBottom: 4,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#ffcdcd',
    },
    crashSubHeader: {
        fontSize: 13,
        color: '#aaaaaa',
        fontWeight: '600',
        marginBottom: 5,
    },
    crashDetails: {
        fontSize: 11,
        color: '#cccccc',
        backgroundColor: '#0a0000',
        padding: 10,
        borderRadius: 6,
        fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
        marginBottom: 25,
        maxHeight: 180,
    },
    crashButton: {
        backgroundColor: '#ff4d4d',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
    },
    crashButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    }
});

