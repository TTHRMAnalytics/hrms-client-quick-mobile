// src/screens/WorkspaceScreen.js
import React, { useState, useEffect } from "react";
import useHardwareBack from "../hooks/useHardwareBack";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import MeeplLogo from "../components/MeeplLogo";
import CustomButton from "../components/CustomButton";
import CustomToast from "../components/CustomToast";
import LoadingOverlay from "../components/LoadingOverlay";
import NoInternetModal from "../components/NoInternetModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import useInternetStatus from "../hooks/useInternetStatus";
import { getSessionData } from "../services/baseHelper";
import { getWorkspaces } from "../services/api";
import { getUserErrorMessage, handleCriticalError } from "../utils/errorHandler";


/* ---------- helper ---------- */
function getWorkspaceName(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return (
    item.domainname ||
    item.domain ||
    item.workspace_name ||
    item.workspace ||
    item.name ||
    item.title ||
    item.label ||
    ""
  );
}

export default function WorkspaceScreen({ navigation }) {
  useHardwareBack(navigation);
  const [email, setEmail] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const isInternetAvailable = useInternetStatus();
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);

  /* ---------- load email + workspaces ---------- */
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const savedEmail = await getSessionData({ key: "saved_email" });

      if (!savedEmail) {
        navigation.replace("Email");
        return;
      }

      setEmail(savedEmail);
      fetchWorkspaces(savedEmail);
      } catch (e) {
        showToast(getUserErrorMessage(e, 'workspace'));
      }

  };

  const fetchWorkspaces = async (email) => {
    try {
      if (!isInternetAvailable) {
        setShowNoInternetModal(true);
        return;
      }

      setLoading(true);
      const res = await getWorkspaces(email);
      const list = Array.isArray(res) ? res : [];

      setWorkspaces(list);

      if (list.length === 0) {
        showToast("No workspace found for this email. Please check and try again.");
        return;
      }

      if (list.length > 0) {
        setSelected(getWorkspaceName(list[0]));
      }

    } catch (e) {
      const handled = await handleCriticalError(e, navigation);
      if (handled) return;

      if (e?.message === "Network request failed") {
        setShowNetworkErrorModal(true);
        return;
      }

      showToast("Unable to fetch workspaces. Please try again.");

    } finally {
      setLoading(false);
    }
  };


  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
  };

  const handleNext = () => {
    if (!selected) {
      showToast("Please select a workspace to continue.");
      return;
    }

    navigation.navigate("Password", {
      workspace: selected,
    });
  };

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.root}>
      <LoadingOverlay visible={loading} />
      {/* Header */}
      <View style={styles.logoContainer}>
        <MeeplLogo width={64} height={64} />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace("Welcome")}
      >
        <Icon name="arrow-back" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Workspace</Text>
        <Text style={styles.cardSubtitle}>
          Workspaces for <Text style={styles.highlight}>{email}</Text>
        </Text>

        <ScrollView style={styles.workspaceList}>
          {workspaces.map((item, idx) => {
            const name = getWorkspaceName(item);
            if (!name) return null;

            const isActive = name === selected;

            return (
              <TouchableOpacity
                key={name || idx}
                style={[
                  styles.workspaceItem,
                  isActive && styles.workspaceItemActive,
                ]}
                onPress={() => setSelected(name)}
              >
                <View style={styles.workspaceIcon}>
                  <Icon name="business-outline" size={16} color="#aaa" />
                </View>
                <Text
                  style={[
                    styles.workspaceText,
                    isActive && styles.workspaceTextActive,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <CustomButton label="Continue" onPress={handleNext} />
      </View>

      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <NoInternetModal
        visible={showNoInternetModal}
        onRetry={() => {
          setShowNoInternetModal(false);
          fetchWorkspaces(email);
        }}
      />

      <NetworkErrorModal
        visible={showNetworkErrorModal}
        onRetry={() => {
          setShowNetworkErrorModal(false);
          fetchWorkspaces(email);
        }}
        onGoHome={() => {
          setShowNetworkErrorModal(false);
          navigation.replace("Welcome");
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
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
  logoContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.xl,  // This adds space below
  },
  appName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },

  backButton: {
    position: "absolute",
    left: 24,
    top: 48,
    padding: 6,
  },
  card: {
    width: "88%",
    backgroundColor: "#111",
    borderRadius: 28,
    padding: spacing.lg,
    elevation: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  cardSubtitle: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  highlight: {
    color: colors.accent,
  },
  workspaceList: {
    maxHeight: 280,
  },
  workspaceItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#181818",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  workspaceItemActive: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  workspaceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  workspaceText: {
    color: "#dcdcdc",
    fontSize: 14,
  },
  workspaceTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
