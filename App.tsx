// App.tsx
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/AuthNavigator";

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#000000", // match your app's black background
    card: "#000000",
    text: "#ffffff",
  },
};

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <AuthNavigator />
    </NavigationContainer>
  );
}
