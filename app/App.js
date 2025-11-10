import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
    const [isConnected, setIsConnected] = useState(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            {isConnected === null ? (
                <Text style={styles.message}>Checking network...</Text>
            ) : isConnected ? (
                <WebView source={{ uri: 'https://superaitutor.vercel.app' }} style={{ flex: 1 }} />
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

/*
Thanks for your patience — I understand now that your app is a **native mobile app (APK)** that users install, and you're trying to load your **Node.js web server (running locally at `http://127.0.0.1:6100`)** inside a WebView or iframe. You're also enforcing a strict **Content Security Policy (CSP)** on that web server, which is **blocking the app from embedding it**.

Let’s break this down and solve it properly:

---

## 🚫 Why CSP Blocks Your App

Your CSP includes:

```js
frameSrc: ["'self'", "https://vercel.live"]
```

This means only requests from the same origin or `vercel.live` can embed your site in an iframe/WebView. But your **native app has no origin** — it’s not a browser, and it doesn’t send a recognizable domain or protocol like `https://`.

So even if you add `http://127.0.0.1:6100` to `frame-src`, it won’t help — because the **request is coming from a non-browser context**, and CSP doesn’t recognize it as allowed.

---

## ✅ The Real Solution: Dynamically Relax CSP for Your App

You need to **detect when the request is coming from your app**, and **serve a relaxed CSP only in that case**. Here's how:

### 🔐 Step 1: Add a Custom Header from Your App

In your React Native app, modify the WebView to send a custom header:

```js
<WebView
  source={{
    uri: 'http://127.0.0.1:6100/',
    headers: {
      'X-From-App': 'SuperAITutor'
    }
  }}
  style={{ flex: 1 }}
/>
```

### 🧠 Step 2: Detect That Header in Your Node.js Server

In your server, check for that header and adjust CSP accordingly:

```js
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  res.locals.isAppRequest = req.headers['x-from-app'] === 'SuperAITutor';
  next();
});
```

### 🛡️ Step 3: Serve Relaxed CSP for App Requests

Now modify your CSP middleware:

```js
app.use((req, res, next) => {
  const frameSources = ["'self'", "https://vercel.live"];
  if (res.locals.isAppRequest) {
    frameSources.push("*"); // or "http://127.0.0.1:6100" if you prefer
  }

  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-hashes'",
        "https://cdnjs.cloudflare.com",
        "https://vercel.live",
        "https://vercel.com",
        "https://ai-dictionary.github.io",
        "https://code.jquery.com",
        "https://cdn.jsdelivr.net",
        `'nonce-${res.locals.nonce}'`
      ],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": [
        "'self'",
        "https://fonts.googleapis.com",
        "https://maxcdn.bootstrapcdn.com",
        "https://stackpath.bootstrapcdn.com",
        "https://ai-dictionary.github.io",
        "https://getbootstrap.com",
        "'unsafe-inline'"
      ],
      "font-src": [
        "'self'",
        "https://maxcdn.bootstrapcdn.com",
        "https://stackpath.bootstrapcdn.com",
        "https://fonts.gstatic.com",
        "data:"
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://avatars.githubusercontent.com",
        "https://ai-dictionary.github.io",
        "https://vercel.com",
        "https://raw.githubusercontent.com"
      ],
      "connect-src": [
        "'self'",
        "https://maxcdn.bootstrapcdn.com",
        "wss://ws-us3.pusher.com",
        "https://ws-us3.pusher.com",
        "https://chsapi.vercel.app"
      ],
      "frame-src": frameSources
    }
  })(req, res, next);
});
```

---

## ✅ Result

- Your app sends a special header.
- Your server detects it and allows embedding.
- Normal users still get the strict CSP.
- No need for a domain or public hosting.

---

Would you like me to help you implement this header check in a more secure way (e.g., with a token or signature)?

*/