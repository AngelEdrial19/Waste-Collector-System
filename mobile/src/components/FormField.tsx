
import React,{useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,TextInputProps} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {C} from '../theme';

type Props=TextInputProps & {label:string;error?:string;secureToggle?:boolean};
export default function FormField({label,error,secureToggle=false,secureTextEntry,...inputProps}:Props){
 const [visible,setVisible]=useState(false);
 const secure=secureToggle ? !visible : !!secureTextEntry;
 return <View style={styles.wrap}>
  <Text style={styles.label}>{label}</Text>
  <View style={[styles.inputWrap,error&&styles.invalid]}>
   <TextInput {...inputProps} secureTextEntry={secure} blurOnSubmit={false} style={styles.input} placeholderTextColor={C.muted}/>
   {secureToggle&&<TouchableOpacity onPress={()=>setVisible(v=>!v)} style={styles.eye} accessibilityLabel={visible?'Hide password':'Show password'}>
    <Ionicons name={visible?'eye-off-outline':'eye-outline'} size={21} color={C.muted}/>
   </TouchableOpacity>}
  </View>
  {!!error&&<Text style={styles.error}>{error}</Text>}
 </View>
}
const styles=StyleSheet.create({wrap:{marginBottom:12},label:{fontSize:12,fontWeight:'800',color:C.ink,marginBottom:6},inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:'#F8FBF9',borderWidth:1,borderColor:C.line,borderRadius:12},invalid:{borderColor:C.red,backgroundColor:'#FFF7F7'},input:{flex:1,paddingHorizontal:13,paddingVertical:12,color:C.ink,fontSize:14,minHeight:48},eye:{paddingHorizontal:14,paddingVertical:10},error:{color:C.red,fontSize:11,marginTop:5}});
