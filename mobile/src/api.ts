import AsyncStorage from '@react-native-async-storage/async-storage';
export const API=(process.env.EXPO_PUBLIC_API_URL||'http://localhost:4000/api').replace(/\/$/,'');
let token:string|null=null;
export async function setToken(v:string|null){token=v;if(v)await AsyncStorage.setItem('wc_token',v);else await AsyncStorage.removeItem('wc_token')}
export async function loadToken(){token=await AsyncStorage.getItem('wc_token');return token}