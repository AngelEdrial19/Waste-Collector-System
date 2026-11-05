
import React from 'react';
import {TouchableOpacity,Text,StyleSheet} from 'react-native';
import {C} from '../theme';
export function Btn({title,onPress,kind='primary'}:{title:string;onPress:()=>void;kind?:'primary'|'light'|'danger'}){
 return <TouchableOpacity onPress={onPress} style={[s.btn,kind==='light'&&s.light,kind==='danger'&&s.danger]}><Text style={[s.text,kind==='light'&&{color:C.forest}]}>{title}</Text></TouchableOpacity>
}
const s=StyleSheet.create({btn:{backgroundColor:C.forest,borderRadius:12,paddingHorizontal:14,paddingVertical:12,alignItems:'center',justifyContent:'center',marginTop:8},light:{backgroundColor:C.mintLight,borderWidth:1,borderColor:C.mint},danger:{backgroundColor:C.red},text:{color:C.white,fontWeight:'800',fontSize:12}});
