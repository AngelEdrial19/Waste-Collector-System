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
}