
export class FormValidator {
  static required(values: Record<string, string>) {
    const errors: Record<string,string> = {};
    Object.entries(values).forEach(([key,value]) => { if (!value.trim()) errors[key] = 'This field is required.'; });
    return errors;
  }
  static email(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
  static password(value: string) {
    return value.length >= 8;
  }
  static coordinates(latitude: string, longitude: string) {
    const lat=Number(latitude), lng=Number(longitude);
    return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;
  }
}
