import { useEffect, useMemo, useRef, type ComponentType, type Ref } from 'react';
import { Linking, Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import PhoneAi from './modules/abroad-ai';
import { bridgeScript } from './src/bridge';
import appHtml from './src/web/appHtml';

// The library's type definitions collapse to `never` with current TypeScript; this restores them.
type WebViewHandle = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>;

type Msg = { id: number; method: string; args: Record<string, any> };
type Start = { sid: number; lang: string; interimResults: boolean; continuous: boolean };

export default function App() {
  const dark = useColorScheme() === 'dark';
  const web = useRef<WebViewHandle>(null);
  const injected = useMemo(() => bridgeScript(Platform.OS), []);

  // Speech recognition can only run once at a time. When the page asks for a new session while
  // the old one is still closing, the new one waits, so a late "end" never stops the new one.
  const sr = useRef<{ active: number; running: boolean; queued: Start | null }>({ active: 0, running: false, queued: null });

  const send = (name: string, data: object) =>
    web.current?.injectJavaScript(`window.__abroadEvent && window.__abroadEvent(${JSON.stringify(name)}, ${JSON.stringify(data)}); true;`);
  const reply = (id: number, ok: boolean, value: unknown) =>
    web.current?.injectJavaScript(`window.__abroadReply && window.__abroadReply(${id}, ${ok}, ${JSON.stringify(value ?? null)}); true;`);

  const startRecognition = async (o: Start) => {
    const s = sr.current;
    s.active = o.sid;
    s.running = true;
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => ({ granted: false }));
    if (s.active !== o.sid) return;
    if (!perm.granted) {
      s.running = false;
      send('sr.error', { sid: o.sid, error: 'not-allowed', message: 'Microphone or speech permission was denied.' });
      send('sr.end', { sid: o.sid });
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: o.lang,
      interimResults: o.interimResults,
      continuous: o.continuous,
      maxAlternatives: 1,
      // Keep the speaker loud and allow car and headset microphones over Bluetooth.
      iosCategory: { category: 'playAndRecord', categoryOptions: ['defaultToSpeaker', 'allowBluetooth'], mode: 'default' },
    });
  };

  useEffect(() => {
    const s = sr.current;
    const subs = [
      ExpoSpeechRecognitionModule.addListener('start', () => send('sr.start', { sid: s.active })),
      ExpoSpeechRecognitionModule.addListener('result', (e) =>
        send('sr.result', { sid: s.active, transcript: e.results[0]?.transcript ?? '', isFinal: e.isFinal })),
      ExpoSpeechRecognitionModule.addListener('error', (e) => send('sr.error', { sid: s.active, error: e.error, message: e.message })),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        send('sr.end', { sid: s.active });
        s.running = false;
        const next = s.queued;
        s.queued = null;
        if (next) startRecognition(next);
      }),
    ];
    return () => subs.forEach((x) => x.remove());
  }, []);

  const onMessage = async (event: WebViewMessageEvent) => {
    let msg: Msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    const { id, method, args } = msg;
    const s = sr.current;
    try {
      switch (method) {
        case 'sr.start': {
          const o = args as Start;
          if (!s.running) { startRecognition(o); return; }
          s.queued = o;
          ExpoSpeechRecognitionModule.abort();
          // If the old session never reports that it ended, start the new one anyway.
          setTimeout(() => {
            if (s.queued !== o) return;
            s.queued = null;
            send('sr.end', { sid: s.active });
            startRecognition(o);
          }, 1500);
          return;
        }
        case 'sr.stop':
        case 'sr.abort':
          if (s.queued && s.queued.sid === args.sid) { s.queued = null; send('sr.end', { sid: args.sid }); return; }
          if (s.active === args.sid && s.running) method === 'sr.stop' ? ExpoSpeechRecognitionModule.stop() : ExpoSpeechRecognitionModule.abort();
          return;
        case 'tts.speak': {
          const done = (error?: string) => send('tts.done', { uid: args.uid, error });
          Speech.speak(args.text, {
            language: args.lang || undefined,
            rate: typeof args.rate === 'number' ? args.rate : 1,
            onDone: () => done(),
            onStopped: () => done(),
            onError: () => done('synthesis-failed'),
          });
          return;
        }
        case 'tts.stop':
          Speech.stop();
          return;
        case 'awake':
          if (args.on) activateKeepAwakeAsync('conversation').catch(() => {});
          else deactivateKeepAwake('conversation');
          return;
        case 'ai.availability':
          if (!PhoneAi) return reply(id, true, { status: 'unavailable', reason: 'device', platform: Platform.OS });
          return reply(id, true, await PhoneAi.availability(String(args.lang || 'en')));
        case 'ai.download':
          if (!PhoneAi) throw new Error("This phone doesn't have built-in AI.");
          return reply(id, true, await PhoneAi.download());
        case 'ai.generate':
          if (!PhoneAi) throw new Error("This phone doesn't have built-in AI.");
          return reply(id, true, await PhoneAi.generate(String(args.prompt), Number(args.maxTokens) || 400));
      }
    } catch (e: any) {
      if (id) reply(id, false, e?.message || String(e));
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.fill, { backgroundColor: dark ? '#0F1114' : '#F3F4F1' }]} edges={['top', 'bottom']}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <WebView
          ref={web}
          style={[styles.fill, { backgroundColor: dark ? '#0F1114' : '#F3F4F1' }]}
          originWhitelist={['*']}
          // A fixed address keeps saved settings (language, scene, level) between launches.
          source={{ html: appHtml, baseUrl: 'https://abroad.app/' }}
          injectedJavaScriptBeforeContentLoaded={injected}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          keyboardDisplayRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req: { url: string }) => {
            if (req.url.startsWith('https://abroad.app/') || req.url === 'about:blank' || req.url.startsWith('data:')) return true;
            Linking.openURL(req.url).catch(() => {});
            return false;
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
