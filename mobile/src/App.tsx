import React,{useEffect,useState,useCallback} from 'react';
import {Alert,ActivityIndicator,Image,ScrollView,StyleSheet,Text,TouchableOpacity,View,RefreshControl,KeyboardAvoidingView,Platform} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import MapView,{Marker,Callout} from 'react-native-maps';
import {Ionicons} from '@expo/vector-icons';
import {api,loadToken,setToken,uploadPhoto} from './src/api';
import FormField from './src/components/FormField';
import {FormValidator} from './src/services/FormValidator';
import {PhotoService} from './src/services/PhotoService';
import ChatScreen from './src/screens/ChatScreen';
import AuthScreen from './src/screens/AuthScreen';
import {Btn} from './src/components/UI';
import HouseholdMapPicker from './src/components/HouseholdMapPicker';
import {C} from './src/theme';
import type {User,Schedule,Household,Notice} from './src/types';

export default function App(){
    const [user,setUser]=useState<User|null>(null),[boot,setBoot]=useState(true),[tab,setTab]=useState('Home'),[busy,setBusy]=useState(false),[error,setError]=useState('');
    const [email,setEmail]=useState(''),[password,setPassword]=useState('');
    const [loginErrors,setLoginErrors]=useState<Record<string,string>>({}),[registerErrors,setRegisterErrors]=useState<Record<string,string>>({});
 const [showRegister,setShowRegister]=useState(false),[regName,setRegName]=useState(''),[regPhone,setRegPhone]=useState('');
 const [regEmail,setRegEmail]=useState(''),[regPassword,setRegPassword]=useState(''),[regHousehold,setRegHousehold]=useState('');
 const [regAddress,setRegAddress]=useState(''),[regLat,setRegLat]=useState('10.2838'),[regLng,setRegLng]=useState('125.1832'),[regPhoto,setRegPhoto]=useState(''),[regPhotoUri,setRegPhotoUri]=useState('');
 const [schedules,setSchedules]=useState<Schedule[]>([]),[households,setHouseholds]=useState<Household[]>([]),[notices,setNotices]=useState<Notice[]>([]),[drivers,setDrivers]=useState<any[]>([]),[stats,setStats]=useState<any>({});
 const [title,setTitle]=useState(''),[area,setArea]=useState('Poblacion'),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[time,setTime]=useState('07:00'),[notes,setNotes]=useState('');
 const [hhName,setHhName]=useState(''),[address,setAddress]=useState(''),[lat,setLat]=useState('10.2838'),[lng,setLng]=useState('125.1832'),[photo,setPhoto]=useState(''),[photoUri,setPhotoUri]=useState('');
 const [chatText,setChatText]=useState(''),[chat,setChat]=useState<any[]>([]),[chatTarget,setChatTarget]=useState<number|null>(null);
 const [profileName,setProfileName]=useState(''),[phone,setPhone]=useState(''),[selectedSchedule,setSelectedSchedule]=useState<number|null>(null);
 const refresh=useCallback(async()=>{if(!user)return;try{
  const [sc,hh,no]=await Promise.all([api<Schedule[]>('/schedules'),api<Household[]>('/households'),api<Notice[]>('/notifications')]);setSchedules(sc);setHouseholds(hh);setNotices(no);
  if(user.role==='admin'){const [d,st]=await Promise.all([api<any[]>('/drivers'),api<any>('/dashboard')]);setDrivers(d);setStats(st)}
  if(user.role==='driver'){const a=await api<any[]>('/assignments');if(a.length&&!selectedSchedule)setSelectedSchedule(a[0].schedule_id)}
 }catch(e:any){setError(e.message)}},[user,selectedSchedule]);
 useEffect(()=>{(async()=>{await loadToken();try{const me=await api<User>('/me');setUser(me);setProfileName(me.name);setPhone(me.phone||'')}catch{}setBoot(false)})()},[]);
 useEffect(()=>{if(!user)return;refresh();const t=setInterval(refresh,7000);return()=>clearInterval(t)},[user,refresh]);
 useEffect(()=>{if(!user||chatTarget===null)return;let active=true;const loadMessages=async()=>{try{const rows=await api<any[]>(`/messages/${chatTarget}`);if(active)setChat(rows)}catch{}};loadMessages();const timer=setInterval(loadMessages,3000);return()=>{active=false;clearInterval(timer)}},[user,chatTarget]);
 const run=async(fn:()=>Promise<any>,success?:string)=>{try{await fn();if(success)Alert.alert('Success',success);await refresh()}catch(e:any){Alert.alert('Unable to complete',e.message)}};
 const login=async()=>{
  const errors:Record<string,string>={};
  if(!email.trim())errors.email='Please enter your email address.';
  else if(!FormValidator.email(email))errors.email='Enter a valid email address.';
  if(!password)errors.password='Please enter your password.';
  setLoginErrors(errors);if(Object.keys(errors).length)return;
  setBusy(true);setError('');
  try{const r=await api<any>('/auth/login','POST',{email:email.trim().toLowerCase(),password});await setToken(r.token);setUser(r.user);setProfileName(r.user.name);setPhone(r.user.phone||'');setTab('Home')}
  catch(e:any){setError(e.message)}finally{setBusy(false)}
 };
 const register=async()=>{
  const errors:Record<string,string>={};
  const required:{[k:string]:string}={name:regName,email:regEmail,password:regPassword,household:regHousehold,address:regAddress};
  Object.entries(required).forEach(([k,v])=>{if(!v.trim())errors[k]='This field is required.'});
  if(regEmail.trim()&&!FormValidator.email(regEmail))errors.email='Enter a valid email address.';
  if(regPassword&&!FormValidator.password(regPassword))errors.password='Use at least 8 characters.';
  if(!FormValidator.coordinates(regLat,regLng))errors.coordinates='Enter valid latitude and longitude.';
  setRegisterErrors(errors);if(Object.keys(errors).length)return;
  setBusy(true);setError('');
  try{
   let uploadedPhoto='';
   const r=await api<any>('/auth/register','POST',{
    name:regName.trim(),email:regEmail.trim().toLowerCase(),password:regPassword,phone:regPhone.trim(),
    householdName:regHousehold.trim(),address:regAddress.trim(),latitude:Number(regLat),longitude:Number(regLng),photoUrl:''
   });
   await setToken(r.token);setUser(r.user);setProfileName(r.user.name);setPhone(r.user.phone||'');setTab('Home');setShowRegister(false);
   if(regPhotoUri){try{uploadedPhoto=await uploadPhoto(regPhotoUri);await api('/households','POST',{householdName:regHousehold.trim(),address:regAddress.trim(),latitude:Number(regLat),longitude:Number(regLng),photoUrl:uploadedPhoto});}catch(photoError:any){Alert.alert('Account created','Your account is ready, but the house photo could not upload: '+photoError.message);return;}}
   Alert.alert('Account created','Your resident account and household map location have been registered.');
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 };
 const chooseRegPhoto=async(source:'camera'|'gallery')=>{try{const uri=source==='camera'?await PhotoService.takePhoto():await PhotoService.chooseFromGallery();if(uri)setRegPhotoUri(uri)}catch(e:any){Alert.alert('Photo',e.message)}};
 const logout=async()=>{await setToken(null);setUser(null);setTab('Home')};
 const publish=()=>run(async()=>{
  if(!title.trim()||!area.trim()||!date.trim()||!time.trim())throw new Error('Please complete the schedule title, area, date and time.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Use date format YYYY-MM-DD.');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Use time format HH:MM (24-hour).');
  await api('/schedules','POST',{title,area,collectionDate:date,startTime:time,notes});setTitle('');setNotes('')
 },'Schedule published. Drivers and residents have been notified.');
 const editSchedule=(x:Schedule)=>{setTitle(x.title);setArea(x.area);setDate(x.collection_date);setTime(x.start_time);setNotes(x.notes);Alert.alert('Edit schedule','The schedule details are loaded into the form. Change them, then tap Save Changes.')};
 const saveEdit=(id:number)=>run(async()=>{
  if(!title.trim()||!area.trim()||!date.trim()||!time.trim())throw new Error('Complete all required schedule fields.');
  await api(`/schedules/${id}`,'PUT',{title,area,collectionDate:date,startTime:time,notes,status:'published'});
 },'Schedule updated.');
}