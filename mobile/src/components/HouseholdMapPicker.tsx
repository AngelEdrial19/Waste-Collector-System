
import React from 'react';
import {View,StyleSheet} from 'react-native';
import MapView,{Marker} from 'react-native-maps';
type Props={latitude:string;longitude:string;onChange:(lat:string,lng:string)=>void;height?:number};
export default function HouseholdMapPicker({latitude,longitude,onChange,height=230}:Props){
 const lat=Number(latitude)||10.2838,lng=Number(longitude)||125.1832;
 return <View style={[s.wrap,{height}]}><MapView style={StyleSheet.absoluteFill} initialRegion={{latitude:lat,longitude:lng,latitudeDelta:.012,longitudeDelta:.012}} region={{latitude:lat,longitude:lng,latitudeDelta:.012,longitudeDelta:.012}} onPress={e=>onChange(String(e.nativeEvent.coordinate.latitude),String(e.nativeEvent.coordinate.longitude))}><Marker draggable coordinate={{latitude:lat,longitude:lng}} pinColor="red" onDragEnd={e=>onChange(String(e.nativeEvent.coordinate.latitude),String(e.nativeEvent.coordinate.longitude))}/></MapView></View>;
}
const s=StyleSheet.create({wrap:{borderRadius:15,overflow:'hidden',marginBottom:12}});
