export type Channel = 'email' | 'sms' | 'whatsapp' | 'push';

export interface Notification {
  readonly channel: Channel;
  readonly to: string;
  readonly template: string;
  readonly data: Readonly<Record<string, string>>;
}

export interface Notifier {
  send(notification: Notification): Promise<void>;
}
