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
 const accept=(id:number)=>run(async()=>{await api(`/assignments/${id}/accept`,'POST');setSelectedSchedule(id)},'Schedule accepted.');
 const startRoute=(id:number)=>run(()=>api(`/assignments/${id}/start`,'POST'),'Route started.');
 const pickup=(h:Household,status:'picked_up'|'not_picked_up')=>run(async()=>{if(!selectedSchedule)throw new Error('Accept a schedule first.');await api('/pickups','POST',{scheduleId:selectedSchedule,householdId:h.id,status})},status==='picked_up'?'Pickup recorded. Resident notified.':'Missed pickup recorded. Resident notified.');
 const chooseHousePhoto=async(source:'camera'|'gallery')=>{try{const uri=source==='camera'?await PhotoService.takePhoto():await PhotoService.chooseFromGallery();if(uri)setPhotoUri(uri)}catch(e:any){Alert.alert('Photo',e.message)}};
 const saveHousehold=()=>run(async()=>{
  if(!hhName.trim()||!address.trim())throw new Error('Household name and complete address are required.');
  if(!FormValidator.coordinates(lat,lng))throw new Error('Please choose a valid map location.');
  const photoUrl=photoUri?await uploadPhoto(photoUri):photo;
  await api('/households','POST',{householdName:hhName||user?.name+' Household',address,latitude:Number(lat),longitude:Number(lng),photoUrl});
 },'Household and map pin saved.');
 const saveProfile=()=>run(async()=>{const u=await api<User>('/me','PATCH',{name:profileName,phone});setUser(u)},'Profile updated.');
 const openChat=async(id:number)=>{setChatTarget(id);try{setChat(await api<any[]>(`/messages/${id}`))}catch(e:any){Alert.alert('Chat',e.message)}};
 const sendChat=()=>{if(chatTarget===null||!chatText.trim())return;run(async()=>{await api('/messages','POST',{receiverId:chatTarget,message:chatText});setChatText('');setChat(await api<any[]>(`/messages/${chatTarget}`))})};
 if(boot)return <View style={s.center}><ActivityIndicator size="large" color={C.forest}/><Text style={s.muted}>Preparing Waste Collector...</Text></View>;
 if(!user)return <AuthScreen
  showRegister={showRegister} busy={busy} error={error} loginErrors={loginErrors} registerErrors={registerErrors}
  email={email} password={password} regName={regName} regPhone={regPhone} regEmail={regEmail} regPassword={regPassword}
  regHousehold={regHousehold} regAddress={regAddress} regLat={regLat} regLng={regLng} regPhotoUri={regPhotoUri}
  setEmail={v=>{setEmail(v);setLoginErrors(p=>({...p,email:''}))}} setPassword={v=>{setPassword(v);setLoginErrors(p=>({...p,password:''}))}}
  setRegName={setRegName} setRegPhone={setRegPhone} setRegEmail={setRegEmail} setRegPassword={setRegPassword}
  setRegHousehold={setRegHousehold} setRegAddress={setRegAddress} setRegLat={setRegLat} setRegLng={setRegLng}
  onLogin={login} onRegister={register} onSwitch={()=>{setShowRegister(v=>!v);setError('');setLoginErrors({});setRegisterErrors({})}} onChoosePhoto={chooseRegPhoto}
 />;
 const Stat=({label,value,icon}:{label:string;value:any;icon:any})=><View style={s.stat}><Ionicons name={icon} size={20} color={C.forest2}/><Text style={s.statValue}>{value??0}</Text><Text style={s.statLabel}>{label}</Text></View>;
 const Header=()=> <View style={s.header}><View><Text style={s.eyebrow}>WASTE COLLECTOR</Text><Text style={s.headerTitle}>Hello, {user.name.split(' ')[0]} 👋</Text></View><TouchableOpacity style={s.bell} onPress={()=>setTab('Notifications')}><Ionicons name="notifications-outline" size={23} color={C.forest}/>{notices.some(n=>!n.read)&&<View style={s.dot}/>}</TouchableOpacity></View>;
 const ScheduleCard=({item}:{item:Schedule})=><View style={s.card}><View style={s.rowBetween}><Text style={s.cardTitle}>{item.title}</Text><Text style={s.pill}>{item.status}</Text></View><Text style={s.muted}>{item.area} • {item.collection_date} • {item.start_time}</Text>{!!item.notes&&<Text style={s.body}>{item.notes}</Text>}{user.role==='admin'?<View style={s.row}><Btn title="Edit" kind="light" onPress={()=>editSchedule(item)}/><Btn title="Save Changes" onPress={()=>saveEdit(item.id)}/><Btn title="Delete" kind="danger" onPress={()=>Alert.alert('Delete schedule?','This cannot be undone.',[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>run(()=>api(`/schedules/${item.id}`,'DELETE'))}])}/></View>:user.role==='driver'?<View style={s.row}><Btn title="Accept Schedule" onPress={()=>accept(item.id)}/><Btn title="Start Route" kind="light" onPress={()=>startRoute(item.id)}/></View>:null}</View>;
 const Home=()=> <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh}/>}>
 {user.role==='admin'?<><View style={s.hero}><Text style={s.heroTag}>MUNICIPAL OVERVIEW</Text><Text style={s.heroTitle}>Cleaner streets,{'\n'}stronger community.</Text><Text style={s.heroSub}>Your waste collection command center.</Text></View><View style={s.statsGrid}><Stat label="Drivers" value={stats.drivers} icon="people"/><Stat label="Available" value={stats.availableDrivers} icon="checkmark-circle"/><Stat label="Households" value={stats.households} icon="home"/><Stat label="Picked up" value={stats.pickups} icon="trash"/></View><Text style={s.section}>Driver availability</Text>{drivers.map(d=><View key={d.id} style={s.card}><View style={s.rowBetween}><View><Text style={s.cardTitle}>{d.name}</Text><Text style={s.muted}>{d.phone}</Text></View><Text style={[s.pill,{backgroundColor:d.available?C.mintLight:'#FCEAEA',color:d.available?C.green:C.red}]}>{d.available?'Available':'On leave'}</Text></View><Btn title="Chat with driver" kind="light" onPress={()=>openChat(d.id)}/></View>)}<Text style={s.section}>Recent schedules</Text>{schedules.slice(0,3).map(x=><ScheduleCard key={x.id} item={x}/>)}</>
 :user.role==='driver'?<><View style={s.hero}><Text style={s.heroTag}>DRIVER DISPATCH</Text><Text style={s.heroTitle}>Ready to make a difference?</Text><Text style={s.heroSub}>Accept today's assignment and follow the household map.</Text></View><View style={s.statsGrid}><Stat label="Households" value={households.length} icon="home"/><Stat label="Unread alerts" value={notices.filter(n=>!n.read).length} icon="notifications"/></View><Text style={s.section}>Collection schedules</Text>{schedules.map(x=><ScheduleCard key={x.id} item={x}/>)}</>
 :<><View style={s.hero}><Text style={s.heroTag}>YOUR HOUSEHOLD</Text><Text style={s.heroTitle}>A cleaner home,{'\n'}a greener tomorrow.</Text><Text style={s.heroSub}>Stay informed about your community's collection day.</Text></View><View style={s.card}><Text style={s.cardTitle}>Latest update</Text><Text style={s.body}>{notices[0]?.message||'No new updates yet. We will notify you when collection is scheduled.'}</Text></View><Text style={s.section}>Upcoming collection</Text>{schedules.slice(0,3).map(x=><ScheduleCard key={x.id} item={x}/>)}</>}
 </ScrollView>;
 const AdminSchedule=()=> <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={s.content}><Text style={s.section}>Publish a collection schedule</Text><View style={s.card}><FormField label="Schedule title" value={title} onChangeText={setTitle}/><FormField label="Collection area / barangay" value={area} onChangeText={setArea}/><FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate}/><FormField label="Start time (HH:MM)" value={time} onChangeText={setTime}/><FormField label="Instructions / notes" value={notes} onChangeText={setNotes}/><Btn title="Publish & Notify Everyone" onPress={publish}/></View><Text style={s.section}>Manage schedules</Text>{schedules.map(x=><ScheduleCard key={x.id} item={x}/>)}</ScrollView>;
 const MapScreen=()=> <View style={{flex:1}}><MapView style={{flex:1}} initialRegion={{latitude:10.2838,longitude:125.1832,latitudeDelta:.035,longitudeDelta:.035}}>{households.map(h=><Marker key={h.id} coordinate={{latitude:h.latitude,longitude:h.longitude}} pinColor={h.pickup_status==="picked_up"?"green":"red"}><Callout><View style={{width:205,padding:5}}><Text style={{fontWeight:'800',color:C.forest}}>{h.household_name}</Text><Text>{h.resident_name}</Text><Text>{h.address}</Text>{h.photo_url?<Image source={{uri:h.photo_url}} style={{width:190,height:95,marginTop:6,borderRadius:8}}/>:null}</View></Callout></Marker>)}</MapView><View style={s.mapInfo}><Text style={s.cardTitle}>Household collection map</Text><Text style={s.muted}>Tap a marker for household details. Red = pending; green = collected (pickup actions below).</Text></View><ScrollView horizontal style={s.mapCards}>{households.map(h=><View key={h.id} style={[s.card,{width:265,marginRight:10}]}><Text style={s.cardTitle}>{h.household_name}</Text><Text style={s.muted}>{h.resident_name} • {h.address}</Text>{h.photo_url?<Image source={{uri:h.photo_url}} style={{height:85,borderRadius:10,marginVertical:8}}/>:null}{user.role==='driver'&&<View style={s.row}><Btn title="Done Pickup" onPress={()=>pickup(h,'picked_up')}/><Btn title="Not Pick Up" kind="danger" onPress={()=>pickup(h,'not_picked_up')}/></View>}</View>)}</ScrollView></View>;
 const Household=()=> <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={s.content}><Text style={s.section}>Household location</Text><View style={s.card}><Text style={s.body}>Drag the red pin to the exact location of your home. The selected coordinates are saved to your household profile.</Text><FormField label="Household name" value={hhName} onChangeText={setHhName}/><FormField label="Complete address" value={address} onChangeText={setAddress}/><Text style={s.label}>Pin your home location</Text><HouseholdMapPicker latitude={lat} longitude={lng} onChange={(a,b)=>{setLat(a);setLng(b)}} height={280}/><Text style={s.muted}>Latitude: {Number(lat).toFixed(6)} · Longitude: {Number(lng).toFixed(6)}</Text><Text style={s.label}>House photo</Text>{photoUri?<Image source={{uri:photoUri}} style={{height:160,borderRadius:14,marginBottom:8}}/>:photo?<Image source={{uri:photo}} style={{height:160,borderRadius:14,marginBottom:8}}/>:<Text style={s.muted}>No house photo selected.</Text>}<View style={s.row}><Btn title="Choose from Gallery" kind="light" onPress={()=>chooseHousePhoto('gallery')}/><Btn title="Take Photo" kind="light" onPress={()=>chooseHousePhoto('camera')}/></View><Btn title="Save Household & Map Pin" onPress={saveHousehold}/></View></ScrollView>;
 const NotificationsScreen=()=> <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={s.content}><Text style={s.section}>Your notifications</Text>{notices.length===0?<View style={s.card}><Text style={s.muted}>You're all caught up.</Text></View>:notices.map(n=><TouchableOpacity key={n.id} onPress={()=>run(()=>api(`/notifications/${n.id}/read`,'PATCH'))}><View style={s.card}><View style={s.rowBetween}><Text style={s.cardTitle}>{n.title}</Text>{!n.read&&<View style={s.unread}/>}</View><Text style={s.body}>{n.message}</Text><Text style={s.muted}>{n.created_at}</Text></View></TouchableOpacity>)}</ScrollView>;
 const Chat=()=> <ChatScreen user={user} drivers={drivers} target={chatTarget} messages={chat} message={chatText} onMessage={setChatText} onOpen={openChat} onBack={()=>setChatTarget(null)} onSend={sendChat}/>;
 const Profile=()=> <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={s.content}><View style={s.profileHero}><View style={s.avatar}><Ionicons name="person" size={34} color={C.forest}/></View><Text style={s.profileName}>{user.name}</Text><Text style={s.profileRole}>{user.role.toUpperCase()}</Text></View><View style={s.card}><FormField label="Full name" value={profileName} onChangeText={setProfileName}/><FormField label="Phone number" value={phone} onChangeText={setPhone}/><Text style={s.label}>Email address</Text><Text style={s.readonly}>{user.email}</Text><Btn title="Save Profile" onPress={saveProfile}/></View>{user.role==='driver'&&<View style={s.card}><Text style={s.cardTitle}>Availability status</Text><Text style={s.muted}>Let the admin know if you are available.</Text><View style={s.row}><Btn title="Available" onPress={()=>run(()=>api('/me','PATCH',{available:true}),'Status updated.')}/><Btn title="On Leave" kind="danger" onPress={()=>run(()=>api('/me','PATCH',{available:false}),'Status updated.')}/></View></View>}<View style={s.card}><Text style={s.cardTitle}>App settings</Text><Text style={s.body}>Waste Collector • Deep Forest & Mint</Text><Text style={s.muted}>Event-driven mobile application</Text><Btn title="Sign Out" kind="danger" onPress={logout}/></View></ScrollView>;
 const screens:any={Home:Home(),Schedules:user.role==='admin'?AdminSchedule():Home(),Map:MapScreen(),Household:Household(),Notifications:NotificationsScreen(),Chat:Chat(),Profile:Profile()};
 const nav=user.role==='admin'?[['Home','home'],['Schedules','calendar'],['Chat','chatbubbles'],['Notifications','notifications'],['Profile','person']]:user.role==='driver'?[['Home','home'],['Map','map'],['Chat','chatbubbles'],['Notifications','notifications'],['Profile','person']]:[['Home','home'],['Household','home'],['Notifications','notifications'],['Profile','person']];
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.app}><StatusBar style="dark"/><Header/>{screens[tab]||Home()}<View style={s.nav}>{nav.map(([name,icon])=><TouchableOpacity key={name} onPress={()=>{if(name!=='Chat')setChatTarget(null);setTab(name)}} style={s.navItem}><Ionicons name={icon as any} size={21} color={tab===name?C.forest:C.muted}/><Text style={[s.navText,tab===name&&{color:C.forest,fontWeight:'800'}]}>{name}</Text></TouchableOpacity>)}</View></View></KeyboardAvoidingView>;
}