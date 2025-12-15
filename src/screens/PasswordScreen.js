// src/screens/PasswordScreen.js

import React, { useState, useEffect } from "react";
import useHardwareBack from "../hooks/useHardwareBack";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import CustomToast from "../components/CustomToast";
import LoadingOverlay from "../components/LoadingOverlay";
import NoInternetModal from "../components/NoInternetModal";          //  added
import NetworkErrorModal from "../components/NetworkErrorModal";      //  added
import useInternetStatus from "../hooks/useInternetStatus";           //  added
import { signIn, getuserinfo } from "../services/api";
import { addSessionData, getSessionData } from "../services/baseHelper";

export default function PasswordScreen({ navigation, route }) {
  useHardwareBack(navigation);

  const workspace = route?.params?.workspace || "Workspace";
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadEmail();
  }, []);

  const loadEmail = async () => {
    const savedEmail = await getSessionData({ key: "saved_email" });
    if (savedEmail) {
      setEmail(savedEmail);
    }
  };

  const workspaces = route?.params?.workspaces || [];

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const isInternetAvailable = useInternetStatus();                    //  added
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);   //  added
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false); //  added

  const handleSignIn = async () => {
    if (!password.trim()) {
      setToast({
        visible: true,
        message: "Please enter your password.",
        type: "error",
      });
      return;
    }

    if (!isInternetAvailable) {                                       //  offline -> modal
      setShowNoInternetModal(true);
      return;
    }

    try {
      setLoading(true);
      const result = await signIn({
        userId: email,
        domain: workspace,
        password,
      });

      let companyName = "";
      let employeeName = "";

      // Store user data in AsyncStorage
      if (result && result.data) {
        // Extract the NUMERIC userid from API response
        const numericUserId = result.data.userid || result.data.user_id || result.data.id;

        // Make sure numericUserId is defined before calling getuserinfo
        if (numericUserId) {
          try {
            const userinfo = await getuserinfo({
              userId: numericUserId,
              domain: workspace,
            });

            // userinfo.data may be an array of users or an object
            const resUserData = Array.isArray(userinfo?.data) ? userinfo.data[0] : userinfo?.data;
            const employeeId = resUserData?.employee_id || numericUserId;
            employeeName =
              (resUserData &&(resUserData.employee_name || resUserData.full_name || resUserData.emp_name || resUserData.name)) ||
              userinfo?.data?.employee_name ||
              "";

            companyName =
              (resUserData && (resUserData.company_full_name || resUserData.company_name || resUserData.company)) ||
              userinfo?.data?.company_full_name ||
              "";

            // Store all necessary data with CORRECT user_id
            await addSessionData({ key: "user_id", value: String(numericUserId) }); // Store numeric user_id
            await addSessionData({ key: "userId", value: String(numericUserId) }); // Also store as userId
            await addSessionData({ key: "employee_id", value: String(employeeId) });
            await addSessionData({ key: "emp_id", value: String(employeeId) });
            await addSessionData({ key: "domain_name", value: workspace });
            await addSessionData({ key: "user_email", value: email });
            await addSessionData({ key: "company_id", value: String(companyName || "") });
            await addSessionData({ key: "user_type", value: result.data.user_type || "" });
            await addSessionData({ key: "company_raw_userinfo", value: JSON.stringify(userinfo?.data || "") });
            await addSessionData({ key: "employee_name", value: String(employeeName || "") });

          } catch (infoErr) {
            // If getuserinfo fails, still store minimal data and continue
            console.warn("getuserinfo failed:", infoErr);
            await addSessionData({ key: "user_id", value: String(result.data.userid || result.data.user_id || "") });
            await addSessionData({ key: "userId", value: String(result.data.userid || result.data.user_id || "") });
            await addSessionData({ key: "domain_name", value: workspace });
            await addSessionData({ key: "user_email", value: email });
            await addSessionData({ key: "company_id", value: "" });
          }
        } else {
          // fallback: result.data exists but no numeric id
          const fallbackId = email.split('@')[0];
          await addSessionData({ key: 'user_id', value: fallbackId });
          await addSessionData({ key: 'userId', value: fallbackId });
          await addSessionData({ key: 'employee_id', value: fallbackId });
          await addSessionData({ key: 'domain_name', value: workspace });
          await addSessionData({ key: 'user_email', value: email });
          await addSessionData({ key: 'company_id', value: "" });
        }
      } else {
        console.warn("  No data in login response, using email as fallback");
        const fallbackId = email.split('@')[0];
        await addSessionData({ key: 'user_id', value: fallbackId });
        await addSessionData({ key: 'userId', value: fallbackId });
        await addSessionData({ key: 'employee_id', value: fallbackId });
        await addSessionData({ key: 'domain_name', value: workspace });
        await addSessionData({ key: 'user_email', value: email });
        await addSessionData({ key: 'company_id', value: "" });
      }

      // Navigate to Home and pass company name so HomeScreen can render it immediately
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { email, workspace, company: companyName, employee_name: employeeName } }],
      });
    } catch (err) {
      console.error("  Login error:", err);
      if (err?.message === "Network request failed") {               //  network failure -> modal
        setShowNetworkErrorModal(true);
      } else {
        setToast({
          visible: true,
          message: "Password is invalid",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Logo */}
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Card */}
      <View style={styles.card}>
        {/* Building Icon */}
        <View style={styles.cardIcon}>
          <Icon name="business-outline" size={22} color="#fff" />
        </View>

        <Text style={styles.cardTitle}>Enter Password</Text>
        <Text style={styles.cardSubtitle}>{workspace}</Text>

        {/* Password Input with eye icon on the RIGHT */}
        <CustomInput
          label="Enter your password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          rightElement={
            <TouchableOpacity onPress={() => setShow(!show)}>
              <Icon
                name={show ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          }
        />

        <CustomButton label="Sign In" onPress={handleSignIn} />

        {/* Only show if there are multiple workspaces */}
        {workspaces.length > 1 && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Workspace", { email, workspaces })}
          >
            <Text style={styles.link}>Select different workspace</Text>
          </TouchableOpacity>
        )}

        {/* Forgot Password Link
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </TouchableOpacity>*/}

      </View>

      <LoadingOverlay visible={loading} />
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      {/*  No Internet Modal */}
      <NoInternetModal
        visible={showNoInternetModal}
        onRetry={() => {
          setShowNoInternetModal(false);
          handleSignIn();
        }}
      />

      {/*  Network Error Modal */}
      <NetworkErrorModal
        visible={showNetworkErrorModal}
        onRetry={() => {
          setShowNetworkErrorModal(false);
          handleSignIn();
        }}
        onGoHome={() => {
          setShowNetworkErrorModal(false);
          navigation.replace("Workspace", { email, workspaces });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerLogo: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  appName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },
  backButton: {
    position: "absolute",
    left: 22,
    top: 48,
    padding: 6,
  },
  card: {
    width: "88%",
    backgroundColor: "#111",
    padding: spacing.lg,
    borderRadius: 28,
    elevation: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1b1b1b",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  link: {
    marginTop: spacing.md,
    color: "#ccc",
    textAlign: "center",
  },
  forgotLink: {
    marginTop: 4,
    color: colors.accent,
    textAlign: "center",
  },
});
