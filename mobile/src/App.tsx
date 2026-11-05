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
}