import { NativeModule, requireOptionalNativeModule } from 'expo';

export type PhoneAiStatus = {
  status: 'available' | 'downloadable' | 'downloading' | 'unavailable';
  // device: this phone has no built-in AI. off: Apple Intelligence is turned off in Settings.
  // notReady: the model is still downloading. language: it doesn't speak this language. os: iOS too old.
  reason: '' | 'device' | 'off' | 'notReady' | 'language' | 'os';
  platform: 'ios' | 'android';
  // Android's Gemini Nano is only validated by Google for English and Korean so far.
  preview?: boolean;
};

declare class AbroadAiModule extends NativeModule<{}> {
  availability(lang: string): Promise<PhoneAiStatus>;
  download(): Promise<string>;
  generate(prompt: string, maxTokens: number): Promise<string>;
}

// Optional so the app still opens (with free scenes only) in builds without this module.
export default requireOptionalNativeModule<AbroadAiModule>('AbroadAi');
