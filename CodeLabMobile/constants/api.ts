import { Platform } from 'react-native';

const defaultHost = Platform.select({ android: '10.0.2.2', ios: 'localhost' }) ?? 'localhost';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${defaultHost}:8080`;