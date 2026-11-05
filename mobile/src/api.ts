import AsyncStorage from '@react-native-async-storage/async-storage';
export const API=(process.env.EXPO_PUBLIC_API_URL||'http://localhost:4000/api').replace(/\/$/,'');
let token:string|null=null;
export async function setToken(v:string|null){token=v;if(v)await AsyncStorage.setItem('wc_token',v);else await AsyncStorage.removeItem('wc_token')}
export async function loadToken(){token=await AsyncStorage.getItem('wc_token');return token}
export class ApiClient {
  async request<T=any>(path:string,method='GET',body?:any):Promise<T>{
    const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);
    return data as T;
  }
  async uploadHousePhoto(uri:string):Promise<string>{
    const form=new FormData();
    const name=uri.split('/').pop()||'house-photo.jpg';
    const ext=name.split('.').pop()?.toLowerCase();
    const type=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
    form.append('photo',{uri,name,type} as any);
    const response=await fetch(API+'/uploads/house-photo',{method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},body:form});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Photo upload failed.');
    return data.photoUrl as string;
  }
}