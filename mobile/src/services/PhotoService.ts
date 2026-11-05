
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto } from '../api';

export class PhotoService {
  static async chooseFromGallery(): Promise<string | null> {
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted) throw new Error('Allow photo library access to choose a house picture.');
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[4,3],quality:0.75});
    return result.canceled?null:result.assets[0]?.uri ?? null;
  }
  static async takePhoto(): Promise<string | null> {
    const permission=await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted) throw new Error('Allow camera access to take a house picture.');
    const result=await ImagePicker.launchCameraAsync({allowsEditing:true,aspect:[4,3],quality:0.75});
    return result.canceled?null:result.assets[0]?.uri ?? null;
  }
  static async upload(uri: string): Promise<string> { return uploadPhoto(uri); }
}
