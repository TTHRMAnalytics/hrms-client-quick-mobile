import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import ConfirmLogoutModal from "../components/ConfirmLogoutModal";
import { clearSessionData, getSessionData } from "../services/baseHelper";
import MeeplLogo from "../components/MeeplLogo";

export default function HomeScreen({ navigation, route }) {
  const [email, setEmail] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);

  const workspaceParam = route?.params?.workspace || "";
  const companyParam = route?.params?.company || "";
  const employeeNameParam = route?.params?.employee_name || "";

  const [workspace, setWorkspace] = useState(workspaceParam);
  const [company, setCompany] = useState(companyParam);
  const [employeeName, setEmployeeName] = useState(employeeNameParam);

  const loadEmailAndProfile = async () => {
    const savedEmail = await getSessionData({ key: "saved_email" });
    if (savedEmail) setEmail(savedEmail);

    if (!workspace) {
      const savedDomain = await getSessionData({ key: "domain_name" });
      if (savedDomain) setWorkspace(savedDomain);
    }

    if (!company) {
      const savedCompany = await getSessionData({ key: "company_id" });
      if (savedCompany) setCompany(savedCompany);
    }

    if (!employeeName) {
      const savedName = await getSessionData({ key: "employee_name" });
      if (savedName) setEmployeeName(savedName);
    }
  };

  useEffect(() => {
    loadEmailAndProfile();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (Platform.OS !== "android") {
        return false;
      }

      const now = Date.now();

      if (lastBackPress && now - lastBackPress < 2000) {
        setShowLogoutModal(true);
        return true;
      }

      setLastBackPress(now);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [lastBackPress]);

  const handleLogout = async () => {
    try {
      await clearSessionData();
    } catch (e) {}

    setShowLogoutModal(false);
    setLastBackPress(0);

    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <MeeplLogo width={64} height={64} />
          <Text style={styles.appName}>MEEPL</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutIconButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.7}
        >
          <Icon name="log-out-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>

        {employeeName ? (
          <View style={styles.companyRow}>
            <Icon name="person" size={18} color="#888" />
            <Text style={styles.userText}>{employeeName}</Text>
          </View>
        ) : null}

        {company ? (
          <View style={styles.companyRow}>
            <Icon name="business" size={18} color="#888" />
            <Text style={styles.companyText}>{company}</Text>
          </View>
        ) : null}

        <View style={styles.companyRow}>
          <Icon name="mail" size={18} color="#888" />
          <Text style={styles.userText}>{email}</Text>
        </View>
      </View>

      <View style={styles.centerContainer}>
        <TouchableOpacity
          style={styles.attendanceCard}
          onPress={() => navigation.navigate("Attendance", { workspace })}
          activeOpacity={0.8}
        >
          <View style={styles.attendanceIconContainer}>
            <Icon name="finger-print" size={60} color={colors.accent} />
          </View>
          <Text style={styles.attendanceTitle}>Attendance</Text>
          <Text style={styles.attendanceSubtitle}>Mark your attendance</Text>
        </TouchableOpacity>
      </View>

      <ConfirmLogoutModal
        visible={showLogoutModal}
        onCancel={() => {
          setShowLogoutModal(false);
          setLastBackPress(0);
        }}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    position: "relative",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  logoutIconButton: {
    position: "absolute",
    right: spacing.lg,
    top: 68,
    padding: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 196, 0, 0.3)",
  },
  welcomeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: "#111",
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  welcomeText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  companyText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  userText: {
    color: colors.accent,
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  attendanceCard: {
    width: "85%",
    backgroundColor: "#111",
    borderRadius: 28,
    padding: spacing.xl * 1.5,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 196, 0, 0.2)",
  },
  attendanceIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  attendanceTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  attendanceSubtitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
  },
});
