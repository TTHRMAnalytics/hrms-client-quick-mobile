// src/utils/locationHelper.js

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// Check if location services are enabled
export const checkLocationEnabled = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve(true);
      },
      (error) => {
        if (error.code === 2) {
          // Location services disabled
          resolve(false);
        } else {
          resolve(true);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

// Request location permission (Android)
export const requestLocationPermission = async () => {

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Meepl Location Permission',
          message: 'Meepl needs access to your location to mark attendance.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );


      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  } else {
    // iOS - permission handled by Info.plist
    return true;
  }
};

// Check if location permission is granted
export const hasLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return hasPermission;
  }
  return true;
};

// Get current GPS location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {

    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };


        resolve(location);
      },
      (error) => {
        console.error('Location error:', error.code, error.message);
        reject(error);
      },
      {
        enableHighAccuracy: true, // Use GPS for exact location
        timeout: 15000,
        maximumAge: 0, // Don't use cached location
      }
    );
  });
};

// Show alert to enable location services
export const showEnableLocationAlert = () => {
  Alert.alert(
    'Location Services Disabled',
    'Please enable location services to use this app. Attendance requires your location.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
          } else {
            Linking.openURL('app-settings:');
          }
        },
      },
    ],
    { cancelable: false }
  );
};

// Show alert for permission denied
export const showPermissionDeniedAlert = () => {
  Alert.alert(
    'Location Permission Required',
    'Meepl requires location permission to mark attendance. Please grant permission in settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        },
      },
    ],
    { cancelable: false }
  );
};
