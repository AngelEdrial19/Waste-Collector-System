# Enhanced Implementation Notes

## OOP and modular organization
- `ApiClient` encapsulates authenticated HTTP requests and multipart photo upload.
- `FormValidator` centralizes form validation rules.
- `PhotoService` encapsulates camera/gallery permission and selection.
- `AuthScreen` owns the login and resident-registration presentation.
- `ChatScreen` owns the chat contact list and one-to-one conversation presentation.
- `HouseholdMapPicker` is a reusable draggable map-pin component.
- `FormField` is a reusable stable input component with inline errors and password visibility.
- `UI.Btn` is a shared action button.

## Keyboard focus fix
Do not define a new React component for each input inside the App render function. Inputs are now imported reusable components and screen functions are rendered without unstable nested component identities. Scroll views keep taps while the keyboard is visible.

## Photo upload
The resident chooses an image from the gallery or opens the camera. The mobile app sends multipart form data to `POST /api/uploads/house-photo`. The API accepts resident-authenticated JPG, PNG or WEBP images up to 8 MB, stores them in `server/uploads`, and returns a URL. The household record stores this URL so drivers can display the image.

## Map pin
The registration and household screens use a draggable red marker and map taps. The latitude and longitude shown below the map are the values sent to the API. Drivers see the household marker; latest pickup status determines red (pending/not collected) or green (picked up).

## Chat
Admin sees a contact list containing the two seeded drivers. Each opens a separate conversation. A driver opens the Municipal Admin conversation. Messages refresh every three seconds while a conversation is open. This is polling, not WebSocket real-time transport.


## Expo Go compatibility patch (SDK 54)
- Removed remote push-notification setup because Expo Go does not support remote push notifications. The app continues to fetch and display backend in-app notifications through its existing API polling.
- Added the missing AuthScreen StyleSheet definition that caused the runtime render error.
